from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS

from flask_bcrypt import check_password_hash, generate_password_hash
import jwt
import datetime
from dotenv import load_dotenv
import os


load_dotenv()

app = Flask(__name__)

CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root@localhost:3306/flaskmysql"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

ma = Marshmallow(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    user = db.Column(db.String(200), unique=True)
    password = db.Column(db.String(200))

    def __init__(self, email, user, password):
        self.email = email
        self.user = user
        self.password = password

def create_table_schema(user):
    class TableSchema(ma.Schema):
        class Meta:
            fields = ("id", "namechat")

    table_schema = TableSchema()
    tables_schema = TableSchema(many=True)

    globals()[f"table_{user}_schema"] = table_schema
    globals()[f"tables_{user}_schema"] = tables_schema


def create_table_schema_chats(user, chatname):
    table_name = f"table_{user}"

    DynamicTable = type(
        table_name,
        (db.Model,),
        {"__tablename__": table_name, "__table_args__": {"autoload_with": db.engine}},
    )

    class TableSchema(ma.SQLAlchemyAutoSchema):
        class Meta:
            model = DynamicTable
            load_instance = True

    table_schema = TableSchema()
    tables_schema = TableSchema(many=True)

    globals()[f"table_{user}_schema"] = table_schema
    globals()[f"tables_{user}_schema"] = tables_schema


with app.app_context():
    db.create_all()


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        fields = ("id", "email", "user", "password")


user_schema = UserSchema()
users_schema = UserSchema(many=True)


@app.route("/register", methods=["POST"])
def create_user():
    email = request.json["email"]
    user = request.json["user"]
    password = generate_password_hash(request.json["password"])
    existing_user = User.query.filter_by(user=user).first()
    if existing_user:
        return jsonify({"error": "User already exists"}), 409
    new_user = User(email, user, password)
    db.session.add(new_user)
    db.session.commit()
    return user_schema.jsonify(new_user)


@app.route("/register", methods=["GET"])
def get_users():
    all_users = User.query.all()
    result = users_schema.dump(all_users)
    return jsonify(result)


@app.route("/register/<id>", methods=["GET"])
def get_user(id):
    user = User.query.get(id)
    return user_schema.jsonify(user)


@app.route("/register/<id>", methods=["PUT"])
def update_user(id):
    user_to_update = User.query.get(id)

    email = request.json["email"]
    new_user = request.json["user"]
    password = generate_password_hash(request.json["password"])

    user_to_update.email = email
    user_to_update.user = new_user
    user_to_update.password = password

    db.session.commit()
    return user_schema.jsonify(user_to_update)


@app.route("/register/<id>", methods=["DELETE"])
def delete_user(id):
    user = User.query.get(id)
    db.session.delete(user)
    db.session.commit()
    return user_schema.jsonify(user)


@app.route("/", methods=["POST"])
def login():
    data = request.get_json()
    username = data["user"]
    password = data["password"]

    user = User.query.filter_by(user=username).first()
    if user and check_password_hash(user.password, password):
        token = generate_token(user)

        return jsonify({"token": token, "user_id": user.id}), 200

    return jsonify({"error": "Credenciales inválidas"}), 401


def generate_token(user):
    token_payload = {
        "user_id": user.id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
    }
    secret_key = "tuclavesecretadeltoken"

    token = jwt.encode(token_payload, secret_key, algorithm="HS256")
    return token

import random
import string

def generate_random_password():
    length = random.randint(8, 16)

    letters_lower = string.ascii_lowercase
    letters_upper = string.ascii_uppercase
    digits = string.digits
    special_chars = string.punctuation

    password = (
        random.choice(letters_upper)
        + random.choice(letters_lower)
        + random.choice(digits)
        + random.choice(special_chars)
    )

    password += "".join(
        random.choices(
            string.ascii_letters + string.digits + string.punctuation, k=length - 4
        )
    )

    password = "".join(random.sample(password, len(password)))

    password = generate_password_hash(password)

    return password


from google.oauth2 import id_token
from google.auth.transport import requests


@app.route("/registergoogle", methods=["POST"])
def create_user_google():
    token = request.json["token"]
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request())

        email = id_info["email"]
        user = id_info["name"]
        password = generate_random_password()

        existing_user = User.query.filter_by(user=user).first()
        if existing_user:
            return jsonify({"error": "User already exists"}), 409

        new_user = User(email, user, password)
        db.session.add(new_user)
        db.session.commit()

        return user_schema.jsonify(new_user)
    except ValueError:
        return jsonify({"error": "Invalid token"}), 401


@app.route("/logingoogle", methods=["POST"])
def login_google():
    token = request.json["token"]
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request())

        email = id_info["email"]
        user = id_info["name"]
        user = User.query.filter_by(email=email).first()
        if user:
            token_in = generate_token(user)

            return (
                jsonify({"token": token_in, "user_id": user.id, "user": user.user}),
                200,
            )

        return jsonify({"error": "Credenciales inválidas"}), 401
    except ValueError:
        return jsonify({"error": "Invalid token"}), 401


@app.route("/tableuser", methods=["POST"])
def create_tableuser():
    try:
        user = request.json.get("user")
        if not user:
            return "user not provided", 400

        import re

        safe_user = re.sub(r"\W+", "_", user)
        table_name = f"table_{safe_user}"

        if table_name in db.metadata.tables:
            return "table already exists", 200

        inspector = inspect(db.engine)
        if table_name in inspector.get_table_names():
            return "table already exists", 200

        attrs = {
            "__tablename__": table_name,
            "__table_args__": {"extend_existing": True},
            "id": db.Column(db.Integer, primary_key=True),
            "chatname": db.Column(db.String(200)),
        }

        UserTable = type(table_name, (db.Model,), attrs)
        UserTable.__table__.create(bind=db.engine)

        return "user table created successfully", 201

    except Exception as e:
        print("Flask Error:", e)
        return str(e), 500


from sqlalchemy import inspect


@app.route("/tableuser/<user>", methods=["POST"])
def post_tableuser(user):
    try:
        chatname = request.json.get("chatname")

        table_name = f"table_{user}"
        inspector = inspect(db.engine)
        if table_name not in inspector.get_table_names():
            return "Table not found", 404

        TableClass = type(table_name, (db.Model,), {})
        table_entry = TableClass(chatname=chatname)

        db.session.add(table_entry)
        db.session.commit()

        return "Data added successfully", 201

    except Exception as e:
        return str(e), 500


from sqlalchemy import inspect
from sqlalchemy import Table


@app.route("/tableuser/<user>", methods=["GET"])
def get_tableuser(user):
    try:
        table_name = f"table_{user}"
        inspector = inspect(db.engine)
        if not inspector.has_table(table_name):
            return "Table not found", 404

        db.reflect()

        table = db.Model.metadata.tables[table_name]

        table_data = db.session.query(table).all()

        data = []
        for row in table_data:
            data.append(
                {
                    "id": row.id,
                    "chatname": row.chatname,
                }
            )

        return jsonify(data), 200

    except Exception as e:
        return str(e), 500


@app.route("/tableuser/<user>/<chatname>", methods=["DELETE"])
def delete_tableuser_chatname(user, chatname):
    try:
        table_name = f"table_{user}"
        inspector = inspect(db.engine)
        if not inspector.has_table(table_name):
            return "Table not found", 404

        db.reflect()

        table = db.Model.metadata.tables[table_name]

        delete_query = table.delete().where(table.c.chatname == chatname)
        db.session.execute(delete_query)
        db.session.commit()

        return "Chatname deleted", 200

    except Exception as e:
        return str(e), 500


@app.route("/tableuser/account/<user>", methods=["DELETE"])
def delete_tableuser(user):
    try:
        table_name = f"table_{user}"
        inspector = inspect(db.engine)
        if not inspector.has_table(table_name):
            return "Table not found", 404

        delete_query = text(f"DROP TABLE {table_name}")
        with db.engine.connect() as connection:
            connection.execute(delete_query)
            
        db.session.expunge_all()
        db.session.close()
        return "Table deleted", 200

    except Exception as e:
        return str(e), 500


@app.route("/tableuser/chats", methods=["POST"])
def create_tableuser_chats():
    try:
        user = request.json.get("user")
        chatname = request.json.get("chatname")
        if not user:
            return "user not provided", 400

        table_name = f"table_{user}_{chatname}"
        user_table_chats = type(
            table_name,
            (db.Model,),
            {
                "id": db.Column(db.Integer, primary_key=True),
                "input": db.Column(db.String(200)),
                "output": db.Column(db.String(200)),
            },
        )

        create_table_schema_chats(user, chatname)

        db.create_all()
        return "user table created successfully", 201

    except Exception as e:
        return str(e), 500


@app.route("/tableuser/chats/<user>/<chatname>", methods=["POST"])
def post_tableuser_chats(user, chatname):
    try:
        from sqlalchemy import Column, Integer, String

        input_text = request.json.get("input")
        output_text = request.json.get("output")

        import re

        safe_user = re.sub(r"\W+", "_", user)
        safe_chat = re.sub(r"\W+", "_", chatname)
        table_name = f"table_{safe_user}_{safe_chat}"
        inspector = inspect(db.engine)

        if not inspector.has_table(table_name):
            return "Table not found", 404

        TableClass = type(
            table_name,
            (db.Model,),
            {
                "__tablename__": table_name,
                "__table_args__": {"extend_existing": True},
                "id": db.Column(db.Integer, primary_key=True),
                "input": db.Column(db.String(200)),
                "output": db.Column(db.String(200)),
            },
        )

        entry = TableClass(input=input_text, output=output_text)
        db.session.add(entry)
        db.session.commit()

        return "Data added successfully", 201

    except Exception as e:
        return str(e), 500


from sqlalchemy import inspect
from sqlalchemy import Table


@app.route("/tableuser/chats/<user>/<chatname>", methods=["GET"])
def get_tableuser_chats(user, chatname):
    import re

    try:
        user = re.sub(r"\W+", "_", user)
        chatname = re.sub(r"\W+", "_", chatname)
        table_name = f"table_{user}_{chatname}"
        inspector = inspect(db.engine)

        if not inspector.has_table(table_name):
            return "Table not found", 404

        db.reflect()
        table = db.Model.metadata.tables[table_name]

        results = db.session.query(table).all()

        data = [
            {"id": row.id, "input": row.input, "output": row.output} for row in results
        ]

        return jsonify(data), 200

    except Exception as e:
        return str(e), 500


from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


@app.route("/tableuser/chats/<user>/<chatname>", methods=["DELETE"])
def delete_tableuser_chats(user, chatname):
    try:
        import re

        clean_user = re.sub(r"\W+", "_", user)
        clean_chat = re.sub(r"\W+", "_", chatname)
        chat_table = f"table_{clean_user}_{clean_chat}"
        meta_table = f"table_{clean_user}"

        inspector = inspect(db.engine)

        if inspector.has_table(chat_table):
            with db.engine.connect() as connection:
                connection.execute(text(f"DROP TABLE `{chat_table}`"))
            if chat_table in db.metadata.tables:
                db.metadata.remove(db.metadata.tables[chat_table])

        if inspector.has_table(meta_table):
            db.reflect()
            meta = db.Model.metadata.tables[meta_table]
            delete_query = meta.delete().where(meta.c.chatname == chatname)
            db.session.execute(delete_query)
            db.session.commit()

        return "Table and metadata deleted successfully", 200

    except Exception as e:
        return str(e), 500


@app.route("/tableuser/chats/all/<user>", methods=["DELETE"])
def delete_tableuser_chats_all(user):
    try:
        inspector = inspect(db.engine)
        table_names = inspector.get_table_names()
        table_name = f"table_{user}_"
        matching_tables = [
            table for table in table_names if table.startswith(table_name)
        ]

        for table in matching_tables:
            delete_query = text(f"DROP TABLE {table}")
            with db.engine.connect() as connection:
                connection.execute(delete_query)

        return "Tablas eliminadas con éxito", 200

    except Exception as e:
        return str(e), 500



def ia_answer_example(input_text):
    import requests
    api_url = "https://api.openai.com/v1/chat/completions"
    api_key = os.getenv("CHATGPT_TOKEN")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    data = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": ""},
            {"role": "user", "content": input_text},
        ],
    }

    try:
        
        response = requests.post(api_url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        reply = result["choices"][0]["message"]["content"]
        return reply
    except Exception as e:
        print("OpenAI API error:", e)
        return "Error generating response"


@app.route("/tableuser/chatss/<user>/<chatname>", methods=["POST"])
def post_tableuser_chats_all(user, chatname):
    try:
        input = request.json.get("input")
        output = ia_answer_example(input)
        if input == "":
            return "input not provided", 400

        table_name = f"table_{user}_{chatname}"
        inspector = inspect(db.engine)
        if table_name not in inspector.get_table_names():
            return "Table not found", 404

        TableClass = type(table_name, (db.Model,), {})
        table_entry = TableClass(input=input, output=output)

        db.session.add(table_entry)
        db.session.commit()

        return "Data added successfully", 201

    except Exception as e:
        return str(e), 500


if __name__ == "__main__":
    app.run(debug=True)
