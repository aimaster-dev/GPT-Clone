FROM python:3.11.3

WORKDIR /code

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

CMD [ "python", "app.py" ]