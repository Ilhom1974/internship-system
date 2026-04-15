from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from sqlalchemy import text
from models import db
from routes import auth_bp

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///internship.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'internship-lms-secret-2025'

db.init_app(app)
bcrypt = Bcrypt(app)

with app.app_context():
    db.create_all()
    # Migration: eski bazaga mentor_score ustunini qo'shish
    with db.engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE internships ADD COLUMN mentor_score FLOAT'))
            conn.commit()
        except Exception:
            pass  # Ustun allaqachon mavjud

app.register_blueprint(auth_bp, url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
