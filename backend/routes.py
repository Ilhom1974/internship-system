from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
import jwt
import datetime
from models import db, User, Internship, Company, Attendance, Journal
from utils import check_proximity

auth_bp = Blueprint('api', __name__)
bcrypt = Bcrypt()
SECRET_KEY = "internship-lms-secret-2025"


def get_user_from_token():
    """JWT tokendan foydalanuvchini olish"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, ('Token topilmadi', 401)
    token = auth_header.split(' ')[1]
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user = User.query.get(data['user_id'])
        if not user:
            return None, ('Foydalanuvchi topilmadi', 404)
        return user, None
    except jwt.ExpiredSignatureError:
        return None, ('Token muddati tugagan', 401)
    except Exception:
        return None, ('Token yaroqsiz', 401)


# ─── AUTH ───────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': "Email va parol kiritilishi shart"}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Email yoki parol xato!'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({'token': token, 'role': user.role, 'full_name': user.full_name})


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    user, err = get_user_from_token()
    if err:
        return jsonify({'message': err[0]}), err[1]

    internship = Internship.query.filter_by(student_id=user.id).first()
    return jsonify({
        'id': user.id,
        'full_name': user.full_name,
        'email': user.email,
        'role': user.role,
        'internship_id': internship.id if internship else None
    })


# ─── TALABA ─────────────────────────────────────────────────────────────────

@auth_bp.route('/check-in', methods=['POST'])
def check_in():
    user, err = get_user_from_token()
    if err:
        return jsonify({'message': err[0]}), err[1]

    data = request.get_json()
    internship_id = data.get('internship_id')
    lat = data.get('lat')
    lng = data.get('lng')

    if not internship_id:
        return jsonify({'message': 'Sizga amaliyot biriktirilmagan!'}), 400
    if lat is None or lng is None:
        return jsonify({'message': 'Koordinatalar topilmadi'}), 400

    internship = Internship.query.get(internship_id)
    if not internship:
        return jsonify({'message': 'Amaliyot topilmadi'}), 404

    company = Company.query.get(internship.company_id)
    if not company:
        return jsonify({'message': 'Korxona ma\'lumotlari topilmadi'}), 404

    is_ok, dist = check_proximity(lat, lng, company.latitude, company.longitude, company.radius_meters)

    new_att = Attendance(
        internship_id=internship.id,
        lat=lat,
        lng=lng,
        is_verified=is_ok
    )
    db.session.add(new_att)
    db.session.commit()

    return jsonify({
        'verified': is_ok,
        'distance': round(dist, 1),
        'company_name': company.name,
        'radius': company.radius_meters
    })


@auth_bp.route('/student/journals/<int:internship_id>', methods=['GET'])
def get_journals(internship_id):
    journals = Journal.query.filter_by(internship_id=internship_id)\
        .order_by(Journal.created_at.desc()).all()
    return jsonify([{
        'id': j.id,
        'entry_date': str(j.entry_date),
        'content': j.content,
        'created_at': str(j.created_at)
    } for j in journals])


@auth_bp.route('/journal', methods=['POST'])
def add_journal():
    user, err = get_user_from_token()
    if err:
        return jsonify({'message': err[0]}), err[1]

    data = request.get_json()
    if not data.get('content', '').strip():
        return jsonify({'message': 'Matn bo\'sh bo\'lmasin'}), 400

    new_j = Journal(
        internship_id=data.get('internship_id'),
        entry_date=datetime.date.today(),
        content=data['content'].strip()
    )
    db.session.add(new_j)
    db.session.commit()
    return jsonify({'message': 'Kundalik saqlandi', 'id': new_j.id})


@auth_bp.route('/student/score/<int:internship_id>', methods=['GET'])
def get_student_score(internship_id):
    internship = Internship.query.get(internship_id)
    if not internship:
        return jsonify({'message': 'Amaliyot topilmadi'}), 404

    total_days = 30  # Amaliyot davomiyligi (reja)

    # 1. Davomat balli (D) — max 100
    verified_days = Attendance.query.filter_by(
        internship_id=internship_id, is_verified=True
    ).count()
    D = min((verified_days / total_days) * 100, 100) if total_days > 0 else 0

    # 2. Kundalik balli (K) — max 100
    journal_count = Journal.query.filter_by(internship_id=internship_id).count()
    K = min((journal_count / total_days) * 100, 100) if total_days > 0 else 0

    # 3. Mentor bahosi (M) — 0-100, mentor qo'ysa bo'ladi
    M = internship.mentor_score if internship.mentor_score is not None else 0

    # Yakuniy ball: S = D*0.3 + K*0.3 + M*0.4
    final_score = (D * 0.3) + (K * 0.3) + (M * 0.4)

    return jsonify({
        'student_name': internship.student.full_name,
        'attendance_score': round(D, 1),
        'journal_score': round(K, 1),
        'mentor_score': M,
        'final_score': round(final_score, 1),
        'verified_days': verified_days,
        'journal_count': journal_count,
        'total_days': total_days,
        'mentor_graded': internship.mentor_score is not None
    })


@auth_bp.route('/internship/<int:internship_id>/company', methods=['GET'])
def get_company_by_internship(internship_id):
    internship = Internship.query.get(internship_id)
    if not internship:
        return jsonify({'message': 'Amaliyot topilmadi'}), 404
    company = internship.company
    if not company:
        return jsonify({'message': 'Korxona biriktirilmagan'}), 404
    return jsonify({
        'id': company.id,
        'name': company.name,
        'latitude': company.latitude,
        'longitude': company.longitude,
        'radius_meters': company.radius_meters
    })


# ─── O'QITUVCHI ─────────────────────────────────────────────────────────────

@auth_bp.route('/teacher/stats/<int:teacher_id>', methods=['GET'])
def get_teacher_stats(teacher_id):
    internships = Internship.query.filter_by(teacher_id=teacher_id).all()
    results = []
    for i in internships:
        verified_days = Attendance.query.filter_by(
            internship_id=i.id, is_verified=True
        ).count()
        journal_count = Journal.query.filter_by(internship_id=i.id).count()
        results.append({
            'internship_id': i.id,
            'student_name': i.student.full_name,
            'company_name': i.company.name if i.company else '—',
            'verified_days': verified_days,
            'journal_count': journal_count,
            'mentor_score': i.mentor_score,
            'status': i.status
        })
    return jsonify(results)


# ─── MENTOR ─────────────────────────────────────────────────────────────────

@auth_bp.route('/mentor/students/<int:mentor_id>', methods=['GET'])
def get_mentor_students(mentor_id):
    internships = Internship.query.filter_by(mentor_id=mentor_id).all()
    results = []
    for i in internships:
        verified_days = Attendance.query.filter_by(
            internship_id=i.id, is_verified=True
        ).count()
        journal_count = Journal.query.filter_by(internship_id=i.id).count()
        results.append({
            'internship_id': i.id,
            'student_name': i.student.full_name,
            'verified_days': verified_days,
            'journal_count': journal_count,
            'mentor_score': i.mentor_score,
            'status': i.status
        })
    return jsonify(results)


@auth_bp.route('/mentor/grade/<int:internship_id>', methods=['PUT'])
def set_mentor_grade(internship_id):
    user, err = get_user_from_token()
    if err:
        return jsonify({'message': err[0]}), err[1]

    data = request.get_json()
    score = data.get('score')

    if score is None:
        return jsonify({'message': 'Ball kiritilmadi'}), 400
    try:
        score = float(score)
    except (ValueError, TypeError):
        return jsonify({'message': 'Ball son bo\'lishi kerak'}), 400
    if not (0 <= score <= 100):
        return jsonify({'message': "Ball 0 dan 100 gacha bo'lishi kerak"}), 400

    internship = Internship.query.get(internship_id)
    if not internship:
        return jsonify({'message': 'Amaliyot topilmadi'}), 404

    internship.mentor_score = score
    db.session.commit()
    return jsonify({'message': f'Baho saqlandi: {score}'})


# ─── ADMIN ──────────────────────────────────────────────────────────────────

@auth_bp.route('/admin/users', methods=['GET'])
def list_users():
    users = User.query.order_by(User.role, User.full_name).all()
    return jsonify([{
        'id': u.id,
        'full_name': u.full_name,
        'email': u.email,
        'role': u.role
    } for u in users])


@auth_bp.route('/admin/users', methods=['POST'])
def add_user():
    data = request.get_json()
    if not all([data.get('full_name'), data.get('email'), data.get('password'), data.get('role')]):
        return jsonify({'message': 'Barcha maydonlar to\'ldirilishi shart'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': "Bu email allaqachon ro'yxatdan o'tgan!"}), 400

    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        full_name=data['full_name'],
        email=data['email'],
        password_hash=hashed_pw,
        role=data['role']
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Foydalanuvchi yaratildi!', 'id': new_user.id})


@auth_bp.route('/admin/companies', methods=['GET'])
def list_companies():
    companies = Company.query.order_by(Company.name).all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'latitude': c.latitude,
        'longitude': c.longitude,
        'radius_meters': c.radius_meters
    } for c in companies])


@auth_bp.route('/admin/companies', methods=['POST'])
def add_company():
    data = request.get_json()
    if not all([data.get('name'), data.get('lat'), data.get('lng')]):
        return jsonify({'message': 'Nomi va koordinatalar kiritilishi shart'}), 400

    new_company = Company(
        name=data['name'],
        latitude=float(data['lat']),
        longitude=float(data['lng']),
        radius_meters=int(data.get('radius', 200))
    )
    db.session.add(new_company)
    db.session.commit()
    return jsonify({'message': "Korxona qo'shildi!", 'id': new_company.id})


@auth_bp.route('/admin/assign', methods=['POST'])
def assign_internship():
    data = request.get_json()
    if not all([data.get('student_id'), data.get('teacher_id'), data.get('company_id')]):
        return jsonify({'message': 'Talaba, o\'qituvchi va korxona tanlanishi shart'}), 400

    # Talaba faqat bitta amaliyotda bo'lishi mumkin
    existing = Internship.query.filter_by(
        student_id=data['student_id'], status='active'
    ).first()
    if existing:
        return jsonify({'message': 'Bu talabaga amaliyot allaqachon biriktirilgan!'}), 400

    new_intern = Internship(
        student_id=int(data['student_id']),
        teacher_id=int(data['teacher_id']),
        company_id=int(data['company_id']),
        mentor_id=int(data['mentor_id']) if data.get('mentor_id') else None,
        status='active'
    )
    db.session.add(new_intern)
    db.session.commit()
    return jsonify({'message': 'Talaba amaliyotga biriktirildi!', 'id': new_intern.id})
