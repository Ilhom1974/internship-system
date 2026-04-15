from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20))  # student, teacher, mentor, admin


class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    radius_meters = db.Column(db.Integer, default=200)


class Internship(db.Model):
    __tablename__ = 'internships'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    mentor_score = db.Column(db.Float, nullable=True)   # Mentor bahosi (0-100)
    status = db.Column(db.String(20), default='active')

    student = db.relationship('User', foreign_keys=[student_id])
    teacher = db.relationship('User', foreign_keys=[teacher_id])
    mentor = db.relationship('User', foreign_keys=[mentor_id])
    company = db.relationship('Company', foreign_keys=[company_id])


class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    internship_id = db.Column(db.Integer, db.ForeignKey('internships.id'))
    check_in_time = db.Column(db.DateTime, default=datetime.utcnow)
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    is_verified = db.Column(db.Boolean, default=False)


class Journal(db.Model):
    __tablename__ = 'journal'
    id = db.Column(db.Integer, primary_key=True)
    internship_id = db.Column(db.Integer, db.ForeignKey('internships.id'))
    entry_date = db.Column(db.Date)
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
