from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_bcrypt import check_password_hash, generate_password_hash
import jwt
import datetime
import random
import string
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy import inspect, text, create_engine
from sqlalchemy.orm import sessionmaker

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:mypassword@localhost:3306/flaskmysql'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
ma = Marshmallow(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    user = db.Column(db.String(200), unique=True)
    password = db.Column(db.String(200))

    def __init__(self, email, user, password):
        self.email = email
        self.user = user
        self.password = password

# Schema generator for dynamic tables
def create_table_schema(user):
    class TableSchema(ma.Schema):
        class Meta:
            fields = ('id', 'chatname')

    table_schema = TableSchema()
    tables_schema = TableSchema(many=True)

    globals()[f'table_{user}_schema'] = table_schema
    globals()[f'tables_{user}_schema'] = tables_schema

def create_table_schema_chats(user, chatname):
    class TableSchemaChats(ma.Schema):
        class Meta:
            fields = ('id', 'namechat')

    table_schema_chats = TableSchemaChats()
    tables_schema_chats = TableSchemaChats(many=True)

    globals()[f'table_{user}_{chatname}schema'] = table_schema_chats
    globals()[f'tables_{user}_{chatname}schema'] = tables_schema_chats

with app.app_context():
    db.create_all()

# User schema
class UserSchema(ma.Schema):
    class Meta:
        fields = ('id', 'email', 'user', 'password')

user_schema = UserSchema()
users_schema = UserSchema(many=True)

# Create a new user
@app.route('/loginup', methods=['POST'])
def create_user():
    email = request.json['email']
    user = request.json['user']
    password = generate_password_hash(request.json['password'])

    if User.query.filter_by(user=user).first():
        return jsonify({'error': 'User already exists'}), 409

    new_user = User(email, user, password)
    db.session.add(new_user)
    db.session.commit()
    return user_schema.jsonify(new_user)

# Get all users
@app.route('/loginup', methods=['GET'])
def get_users():
    all_users = User.query.all()
    result = users_schema.dump(all_users)
    return jsonify(result)

# Get a specific user by ID
@app.route('/loginup/<id>', methods=['GET'])
def get_user(id):
    user = User.query.get(id)
    return user_schema.jsonify(user)

# Update a user
@app.route('/loginup/<id>', methods=['PUT'])
def update_user(id):
    user_to_update = User.query.get(id)
    user_to_update.email = request.json['email']
    user_to_update.user = request.json['user']
    user_to_update.password = generate_password_hash(request.json['password'])

    db.session.commit()
    return user_schema.jsonify(user_to_update)

# Delete a user
@app.route('/loginup/<id>', methods=['DELETE'])
def delete_user(id):
    user = User.query.get(id)
    db.session.delete(user)
    db.session.commit()
    return user_schema.jsonify(user)

# User login and JWT token generation
@app.route('/', methods=['POST'])
def login():
    data = request.get_json()
    username = data['user']
    password = data['password']

    user = User.query.filter_by(user=username).first()
    if user and check_password_hash(user.password, password):
        token = generate_token(user)
        return jsonify({'token': token, 'user_id': user.id}), 200

    return jsonify({'error': 'Invalid credentials'}), 401

# Generate JWT token
def generate_token(user):
    token_payload = {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    secret_key = 'tuclavesecretadeltoken'
    token = jwt.encode(token_payload, secret_key, algorithm='HS256')
    return token

# Generate a secure random password
def generate_random_password():
    length = random.randint(8, 16)
    password = random.choice(string.ascii_uppercase) + random.choice(string.ascii_lowercase) + \
               random.choice(string.digits) + random.choice(string.punctuation)
    password += ''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=length-4))
    password = ''.join(random.sample(password, len(password)))
    return generate_password_hash(password)

# Google user signup
@app.route('/loginupgoogle', methods=['POST'])
def create_user_google():
    token = request.json['token']
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request())
        email = id_info['email']
        user = id_info['name']
        password = generate_random_password()

        if User.query.filter_by(user=user).first():
            return jsonify({'error': 'User already exists'}), 409

        new_user = User(email, user, password)
        db.session.add(new_user)
        db.session.commit()
        return user_schema.jsonify(new_user)
    except ValueError:
        return jsonify({'error': 'Invalid token'}), 401

# Google user login
@app.route('/logingoogle', methods=['POST'])
def login_google():
    token = request.json['token']
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request())
        email = id_info['email']
        user = User.query.filter_by(email=email).first()
        if user:
            token_in = generate_token(user)
            return jsonify({'token': token_in, "user_id": user.id, "user": user.user}), 200
        return jsonify({'error': 'Invalid credentials'}), 401
    except ValueError:
        return jsonify({'error': 'Invalid token'}), 401

# Remaining endpoints manage dynamic table creation, insertion, retrieval, and deletion
# These continue with similar patterns and include user-specific table naming, JSON data processing,
# and database schema reflection.

# Flask app entry point
if __name__ == '__main__':
    app.run(debug=True)

# Docker MySQL commands (for dev reference):
# docker run --name mymysql -e MYSQL_ROOT_PASSWORD=mypassword -p 3306:3306 -d mysql:latest
# docker exec -it mymysql bash
# mysql -u root -p
# create database flaskmysql;
