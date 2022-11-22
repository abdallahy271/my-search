from flask import Flask, request, Response
from flask_sqlalchemy import SQLAlchemy
from flask_msearch import Search
from elasticsearch import Elasticsearch, RequestsHttpConnection
from dotenv import load_dotenv
from worker import celery
from google.oauth2 import id_token
from google.auth.transport import requests
from ssl import create_default_context

import os
import hashlib
# import psycopg2


# dev_mode = True
app = Flask(__name__)

load_dotenv()

# Set up ES
ELASTIC_USERNAME = os.environ.get('ES_USERNAME')
ELASTIC_PASSWORD = os.environ.get('ES_PASSWORD')
ELASTIC_HOST = os.environ.get('ES_HOST')

# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['WHOOSH_BASE'] = 'whoosh'

# db = SQLAlchemy(app)

# search = Search()
# search.init_app(app)


es_client = Elasticsearch(
    hosts=[ELASTIC_HOST],
    scheme="https",
    http_auth=(ELASTIC_USERNAME, ELASTIC_PASSWORD),
    use_ssl=True,
    verify_certs=True,
    connection_class= RequestsHttpConnection
)

# Successful response!
print('client_info', es_client.info())

#When I initially used Whoosh for indexing
# class File(db.Model):
#     __tablename__ = 'files'
#     __searchable__ = ['title', 'content', 'path']
#     id = db.Column(db.Integer, primary_key=True)
#     path = db.Column(db.String())
#     title = db.Column(db.String())
#     content = db.Column(db.String())

@app.before_request
def check_auth_token():
    '''
    Google authentication middleware
    '''
    try:
       
        bearer_token = request.headers.get('Authorization')
        token = bearer_token.split(' ').pop()

        user_email = request.json.get('user')

        CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID') 
        
        # Specify the CLIENT_ID of the app that accesses the backend:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)

        # if multiple clients access the backend server:
        if idinfo['aud'] != CLIENT_ID:
            res = Response(u'Authorization failed. Please login from my-search app.', \
                 status=401)
            return res

        # ID token is valid. Get the user's Google Account ID from the decoded token.
        if idinfo['email'] != user_email:
            res = Response(u'Authorization failed. Please only enter your email address.', \
                 status=401)
            return res
    except:
        # Invalid token
        res = Response(u'Authorization failed. Invalid authentication token.', \
                status=401)
        return res

            
@app.route('/', methods=['GET'])
def my_search():
    return "Welcome to MySearch"

@app.route('/add', methods=['POST', 'GET'])
def add_link():
    if request.method == 'POST':
        user_email = request.get_json()['user']
        historyData = request.get_json()['history']
        results = []
        # run the search asynchronously
        for history in historyData:
                        # scrape_index_link.apply_async(args=[history, user_email])

            celery.send_task('tasks.add_link', args=[history, user_email], kwargs={})

        return results

        # whoosh workflow
        # file = File(path=dic['url'], title=dic['title'], content=dic['content'])
        # db.session.add(file)
        # db.session.commit()


@app.route('/delete', methods=['POST'])
def delete_link():
    if request.method == 'POST':
        user_email = request.get_json()['user']
        removed_sites = request.get_json()['removedSites']
        results = []

        celery.send_task('tasks.delete_link', args=[user_email, removed_sites], kwargs={})

        return results



@app.route('/search', methods=['POST'])
def search():
    if request.method == 'POST':
        query = request.args.get("query", '')
        user_email = request.args.get("user", '')
        after = request.args.get("after", '')
        before = request.args.get("before", '')

        # Elastic search query
        body = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "range": {
                                "lastVisitTime": {
                                    "gte": after,
                                    "lte": before
                                        }
                                    }
                        },
                        {
                            "simple_query_string": 
                                {
                                "query": f"{query}*",
                                "fields": ["content", "title", "url"],
                                "analyze_wildcard": True,
                                "default_operator":"AND"
                                }
                        },
                        {
                            "match": 
                                    {
                                    "user": user_email
                                    }
                        }
                        
                    ]
                }
            }
        }

        res = es_client.search(index="history", body=body)
        
        files = []
        if len(res['hits']['hits']):
            files = [dict(i['_source']) for i in res['hits']['hits'] ]

        return files

        # whoosh wokflow
        # files = File.query.msearch(query).all()
        # return render_template('index.html', files=files)


if __name__ == '__main__':
    app.run()
