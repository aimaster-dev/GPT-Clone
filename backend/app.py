from flask import Flask , request,jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow

#Para usar fronted
from flask_cors import CORS
#------------------------------

#Para autentificar
from flask_bcrypt import check_password_hash, generate_password_hash
import jwt
import datetime
#------------------------------

app = Flask(__name__)

#Para usar fronted
CORS(app)
#---------

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:mypassword@localhost:3306/flaskmysql'
#app.config['SQLALCHEMY_DATABASE_URI'] =  'postgresql://postgres:mypassword@localhost:5432/flaskpostgresql'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db=SQLAlchemy(app)


ma= Marshmallow(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    user= db.Column(db.String(200), unique=True)
    password = db.Column(db.String(200))

    def __init__(self, email, user, password):
        self.email = email
        self.user = user
        self.password = password
        

# Define la función para crear el esquema dinámicamente
def create_table_schema(user):
    class TableSchema(ma.Schema):
        class Meta:
            fields = ('id', 'namechat')

    table_schema = TableSchema()
    tables_schema = TableSchema(many=True)

    globals()[f'table_{user}_schema'] = table_schema
    globals()[f'tables_{user}_schema'] = tables_schema


#----------------------------

# Define la función para crear el esquema dinámicamente CHATS
def create_table_schema_chats(user,chatname):
    class TableSchemaChats(ma.Schema):
        class Meta:
            fields = ('id', 'namechat')

    table_schema_chats = TableSchemaChats()
    tables_schema_chats= TableSchemaChats(many=True)

    globals()[f'table_{user}_{chatname}schema'] = table_schema_chats
    globals()[f'tables_{user}_{chatname}schema'] = tables_schema_chats


#----------------------------
with app.app_context():
    db.create_all()


class UserSchema(ma.Schema):
    class Meta:
        fields = ('id', 'email', 'user', 'password')


user_schema = UserSchema()
users_schema = UserSchema(many=True)



@app.route('/loginup', methods=['POST'])
def create_user():
    email=request.json['email']
    user=request.json['user']
    password = generate_password_hash(request.json['password'])
    existing_user = User.query.filter_by(user=user).first()
    if existing_user:
        return jsonify({'error': 'User already exists'}), 409
    new_user = User(email, user, password)
    db.session.add(new_user)
    db.session.commit()
    return user_schema.jsonify(new_user)

@app.route('/loginup', methods=['GET'])
def get_users():
    all_users=User.query.all()
    result=users_schema.dump(all_users)
    return jsonify(result)                    

@app.route('/loginup/<id>', methods=['GET'])
def get_user(id):
    user=User.query.get(id)
    return user_schema.jsonify(user) 

@app.route('/loginup/<id>', methods=['PUT'])
def update_user(id):
    user_to_update = User.query.get(id)  # Renombrar la variable aquí
    
    email = request.json['email']
    new_user = request.json['user']
    password = generate_password_hash(request.json['password'])

    user_to_update.email = email
    user_to_update.user = new_user  # Renombrar la variable aquí
    user_to_update.password = password
    
    db.session.commit()
    return user_schema.jsonify(user_to_update)



@app.route('/loginup/<id>', methods=['DELETE'])
def delete_user(id):
    user=User.query.get(id)
    db.session.delete(user)
    db.session.commit()
    return user_schema.jsonify(user)


#Login IN (Iniciar sesion)
@app.route('/', methods=['POST'])
def login():
    data = request.get_json()
    username = data['user']
    password = data['password']

    user = User.query.filter_by(user=username).first()
    if user and check_password_hash(user.password, password):
        # Las credenciales son válidas, puedes generar un token de autenticación aquí
        token = generate_token(user)  # Ejemplo: función para generar el token

        return jsonify({'token': token ,"user_id": user.id}), 200

    # Las credenciales son incorrectas
    return jsonify({'error': 'Credenciales inválidas'}), 401


def generate_token(user):
    # Definir las opciones y configuraciones del token
    token_payload = {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # Token expira en 1 hora
    }
    secret_key = 'tuclavesecretadeltoken'  # Cambia esto a tu clave secreta real

    # Generar el token JWT utilizando PyJWT
    token = jwt.encode(token_payload, secret_key, algorithm='HS256')
    return token

#---google-pasword-random
import random
import string

def generate_random_password():
    length = random.randint(8, 16)  # Genera una longitud aleatoria entre 8 y 16 caracteres

    # Define los caracteres válidos para cada categoría
    letters_lower = string.ascii_lowercase
    letters_upper = string.ascii_uppercase
    digits = string.digits
    special_chars = string.punctuation

    # Asegura que la contraseña contenga al menos un carácter de cada categoría
    password = random.choice(letters_upper) + random.choice(letters_lower) + random.choice(digits) + random.choice(special_chars)

    # Completa la contraseña con caracteres aleatorios
    password += ''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=length-4))

    # Mezcla los caracteres de la contraseña
    password = ''.join(random.sample(password, len(password)))

    #Convierte la contraseña en hash
    password = generate_password_hash(password)

    return password

#----GOOGLE
from google.oauth2 import id_token
from google.auth.transport import requests

#----GOOGLE-LOGIN-UP
@app.route('/loginupgoogle', methods=['POST'])
def create_user_google():
    token = request.json['token']
    try:
        # Verificar y decodificar el token de acceso de Google
        id_info = id_token.verify_oauth2_token(token, requests.Request())

        # Obtener la información del usuario de Google
        email = id_info['email']
        user = id_info['name']
        password=generate_random_password()

        # Verificar si el usuario ya existe en tu base de datos
        existing_user = User.query.filter_by(user=user).first()
        if existing_user:
            return jsonify({'error': 'User already exists'}), 409

        # Crear un nuevo usuario en tu base de datos
        new_user = User(email, user, password)
        db.session.add(new_user)
        db.session.commit()

        return user_schema.jsonify(new_user)
    except ValueError:
        # El token no es válido
        return jsonify({'error': 'Invalid token'}), 401

#----GOOGLE-LOGIN-IN
@app.route('/logingoogle', methods=['POST'])
def login_google():
    token = request.json['token']
    try:
        # Verificar y decodificar el token de acceso de Google
        id_info = id_token.verify_oauth2_token(token, requests.Request())

        # Obtener la información del usuario de Google
        email = id_info['email']
        user=id_info['name']
        # Verificar si el usuario ya existe en tu base de datos
        user = User.query.filter_by(email=email).first()
        if user:
           # Las credenciales son válidas, puedes generar un token de autenticación aquí
            token_in = generate_token(user)  # Ejemplo: función para generar el token

            return jsonify({'token': token_in , "user_id": user.id ,"user": user.user}), 200


        return jsonify({'error': 'Credenciales inválidas'}), 401
    except ValueError:
        # El token no es válido
        return jsonify({'error': 'Invalid token'}), 401


#----chat

@app.route('/tableuser', methods=['POST'])
def create_tableuser():
    try:
        user = request.json.get('user')
        if not user:
            return 'user not provided', 400

        table_name = f'table_{user}'
        user_table = type(table_name, (db.Model,), {
            'id': db.Column(db.Integer, primary_key=True),
            'chatname': db.Column(db.String(200))
            
        })

        create_table_schema(user)  # Llama a la función para crear el esquema dinámicamente

        db.create_all()
        return 'user table created successfully', 201

    except Exception as e:
        return str(e), 500
    
from sqlalchemy import inspect

@app.route('/tableuser/<user>', methods=['POST'])
def post_tableuser(user):
    try:
        # Obtener los datos de temperatura y humedad de la solicitud JSON
        chatname = request.json.get('chatname')
        

        # Verificar si la tabla existe en la base de datos
        table_name = f'table_{user}'
        inspector = inspect(db.engine)
        if table_name not in inspector.get_table_names():
            return 'Table not found', 404

        # Crear una instancia de la clase de la tabla dinámica
        TableClass = type(table_name, (db.Model,), {})
        table_entry = TableClass(chatname=chatname)

        # Agregar la nueva entrada a la base de datos
        db.session.add(table_entry)
        db.session.commit()

        return 'Data added successfully', 201

    except Exception as e:
        return str(e), 500  # Devuelve el mensaje de error en caso de que ocurra una excepción

#-----------------------------------------------------------------------------------------

from sqlalchemy import inspect
from sqlalchemy import Table

@app.route('/tableuser/<user>', methods=['GET'])
def get_tableuser(user):
    try:
        table_name = f'table_{user}'  # Genera el nombre de la tabla a buscar
        inspector = inspect(db.engine)
        if not inspector.has_table(table_name):  # Verifica si la tabla existe en la base de datos
            return 'Table not found', 404

        # Reflect the tables from the database
        db.reflect()

        # Obtén la tabla dinámica a partir del nombre
        table = db.Model.metadata.tables[table_name]

        # Realiza la consulta a la tabla
        table_data = db.session.query(table).all()

        # Procesa los datos obtenidos y devuélvelos como respuesta
        data = []
        for row in table_data:
            data.append({
                'id': row.id,
                'chatname': row.chatname,
                
            })

        return jsonify(data), 200

    except Exception as e:
        return str(e), 500  # Devuelve el mensaje de error en caso de que ocurra una excepción


#delete row chatname of the table table_user
@app.route('/tableuser/<user>/<chatname>', methods=['DELETE'])
def delete_tableuser_chatname(user, chatname):
    try:
        table_name = f'table_{user}'  # Genera el nombre de la tabla a buscar
        inspector = inspect(db.engine)
        if not inspector.has_table(table_name):  # Verifica si la tabla existe en la base de datos
            return 'Table not found', 404

        # Reflect the tables from the database
        db.reflect()

        # Obtén la tabla dinámica a partir del nombre
        table = db.Model.metadata.tables[table_name]

        # Realiza la consulta para eliminar el chatname seleccionado
        delete_query = table.delete().where(table.c.chatname == chatname)
        db.session.execute(delete_query)
        db.session.commit()

        return 'Chatname deleted', 200

    except Exception as e:
        return str(e), 500  # Devuelve el mensaje de error en caso de que ocurra una excepción


#from sqlalchemy import text
# delete table_user

@app.route('/tableuser/account/<user>', methods=['DELETE'])
def delete_tableuser(user):
    try:
        table_name = f'table_{user}'  # Genera el nombre de la tabla a buscar
        inspector = inspect(db.engine)
        if not inspector.has_table(table_name):  # Verifica si la tabla existe en la base de datos
            return 'Table not found', 404

        # Ejecuta la sentencia SQL para eliminar la tabla
        delete_query = text(f"DROP TABLE {table_name}")
        with db.engine.connect() as connection:
            connection.execute(delete_query)

        return 'Table deleted', 200

    except Exception as e:
        return str(e), 500  # Devuelve el mensaje de error en caso de que ocurra una excepción


#--chats---

@app.route('/tableuser/chats', methods=['POST'])
def create_tableuser_chats():
    try:
        user = request.json.get('user')
        chatname = request.json.get('chatname')
        if not user:
            return 'user not provided', 400

        table_name = f'table_{user}_{chatname}'
        user_table_chats = type(table_name, (db.Model,), {
            'id': db.Column(db.Integer, primary_key=True),
            'input': db.Column(db.String(200)),
            'output': db.Column(db.String(200))
            
        })

        create_table_schema_chats(user, chatname)  # Llama a la función para crear el esquema dinámicamente

        db.create_all()
        return 'user table created successfully', 201

    except Exception as e:
        return str(e), 500



@app.route('/tableuser/chats/<user>/<chatname>', methods=['POST'])
def post_tableuser_chats(user,chatname):
    try:
        # Obtener los datos de temperatura y humedad de la solicitud JSON
        input = request.json.get('input')
        output = request.json.get('output')
        

        # Verificar si la tabla existe en la base de datos
        table_name = f'table_{user}_{chatname}'
        inspector = inspect(db.engine)
        if table_name not in inspector.get_table_names():
            return 'Table not found', 404

        # Crear una instancia de la clase de la tabla dinámica
        TableClass = type(table_name, (db.Model,), {})
        table_entry = TableClass(input=input, output=output)

        # Agregar la nueva entrada a la base de datos
        db.session.add(table_entry)
        db.session.commit()

        return 'Data added successfully', 201

    except Exception as e:
        return str(e), 500  # Devuelve el mensaje de error en caso de que ocurra una excepción

#-----------------------------------------------------------------------------------------

from sqlalchemy import inspect
from sqlalchemy import Table

@app.route('/tableuser/chats/<user>/<chatname>', methods=['GET'])
def get_tableuser_chats(user,chatname):
    try:
        table_name = f'table_{user}_{chatname}'  # Genera el nombre de la tabla a buscar
        inspector = inspect(db.engine)
        if not inspector.has_table(table_name):  # Verifica si la tabla existe en la base de datos
            return 'Table not found', 404

        # Reflect the tables from the database
        db.reflect()

        # Obtén la tabla dinámica a partir del nombre
        table = db.Model.metadata.tables[table_name]

        # Realiza la consulta a la tabla
        table_data = db.session.query(table).all()

        # Procesa los datos obtenidos y devuélvelos como respuesta
        data = []
        for row in table_data:
            data.append({
                'id': row.id,
                'input': row.input,
                'output': row.output,
                
            })

        return jsonify(data), 200

    except Exception as e:
        return str(e), 500  # Devuelve el mensaje de error en caso de que ocurra una e



#delete  table table_user_chatname 

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

@app.route('/tableuser/chats/<user>/<chatname>', methods=['DELETE'])
def delete_tableuser_chats(user,chatname):
    try:
        # Verificar si la tabla existe en la base de datos
        table_name = f'table_{user}_{chatname}'
        inspector = inspect(db.engine)
        if not inspector.has_table(table_name):
            return 'Table not found', 404

        # Crear una conexión y una sesión
        engine = create_engine(db.engine.url)
        Session = sessionmaker(bind=engine)
        session = Session()

        # Ejecutar una consulta SQL para eliminar la tabla
        query = text(f'DROP TABLE {table_name}')
        session.execute(query)
        session.commit()

        return 'Table deleted successfully', 200

    except Exception as e:
        return str(e), 500  # Devuelve el mensaje de error en caso de que ocurra una excepción


# delete all tables of the user with chatnames(table_user_chatname)
#used for delete accout
#from sqlalchemy import text
@app.route('/tableuser/chats/all/<user>', methods=['DELETE'])
def delete_tableuser_chats_all(user):
    try:
        inspector = inspect(db.engine)
        table_names = inspector.get_table_names()
        table_name = f'table_{user}_'
        matching_tables = [table for table in table_names if table.startswith(table_name)]

        # Eliminar las tablas encontradas
        for table in matching_tables:
            delete_query = text(f"DROP TABLE {table}")
            with db.engine.connect() as connection:
                connection.execute(delete_query)

        return "Tablas eliminadas con éxito", 200

    except Exception as e:
        return str(e), 500  # Devuelve el mensaje de error en caso de que ocurra una excepción


        

#take it like if was the answer to the question
#THIS IS THE IA answer FUNCTION 
def ia_answer_example():
    length = random.randint(8, 16)  # Genera una longitud aleatoria entre 8 y 16 caracteres

    # Define los caracteres válidos para cada categoría
    letters_lower = string.ascii_lowercase
    letters_upper = string.ascii_uppercase
    digits = string.digits
    special_chars = string.punctuation

    # Asegura que la contraseña contenga al menos un carácter de cada categoría
    password = random.choice(letters_upper) + random.choice(letters_lower) + random.choice(digits) + random.choice(special_chars)

    # Completa la contraseña con caracteres aleatorios
    password += ''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=length-4))

    # Mezcla los caracteres de la contraseña
    password = ''.join(random.sample(password, len(password)))

    
    return password

#-----------------------------------------------------------------------------------------
#important
#POST DE CHAT APIDOC
@app.route('/tableuser/chatss/<user>/<chatname>', methods=['POST'])
def post_tableuser_chats_all(user,chatname):
    try:
        # Obtener los datos de temperatura y humedad de la solicitud JSON
        input = request.json.get('input')
        output = ia_answer_example()
        if input == '':
            return 'input not provided', 400

        # Verificar si la tabla existe en la base de datos
        table_name = f'table_{user}_{chatname}'
        inspector = inspect(db.engine)
        if table_name not in inspector.get_table_names():
            return 'Table not found', 404

        # Crear una instancia de la clase de la tabla dinámica
        TableClass = type(table_name, (db.Model,), {})
        table_entry = TableClass(input=input, output=output)

        # Agregar la nueva entrada a la base de datos
        db.session.add(table_entry)
        db.session.commit()

        return 'Data added successfully', 201

    except Exception as e:
        return str(e), 500  # Devuelve el mensaje de error en caso de que ocurra una excepción

#-----------------------------------------------------------------------------------------

if __name__ == '__main__':
    app.run(debug=True)

#Comands for use docker container mysql
#docker run --name mymysql -e MYSQL_ROOT_PASSWORD=mypassword -p 3306:3306 -d mysql:latest
#docker exec -it mymysql bash
#mysql -u root -p
#create database flaskmysql;