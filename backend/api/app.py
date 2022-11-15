from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
from flask_msearch import Search
from elasticsearch import Elasticsearch
from celery import Celery
from dotenv import load_dotenv
from worker import celery

import os
import hashlib
# import psycopg2


dev_mode = True
app = Flask(__name__)

load_dotenv()

ENV = 'dev'
if ENV == 'dev':
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/search'
    # app.config['CELERY_BROKER_URL'] = os.environ.get('CELERY_BROKER_URL')
    app.config['DEBUG'] = True
else:
    app.config['DEBUG'] = False

# Set up celery client
# celery_client = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
# celery_client.conf.update(app.config)

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
    # "https://localhost:9200",
    hosts=[ELASTIC_HOST],
    scheme="https",
    port=443,
    http_auth=(ELASTIC_USERNAME, ELASTIC_PASSWORD),

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

        # return make_response(jsonify(dict(es_file)), 201)
        # return redirect(url_for('hello_world'))


@app.route('/delete', methods=['POST'])
def delete_link():
    if request.method == 'POST':
        user_email = request.get_json()['user']
        removed_sites = request.get_json()['removedSites']
        results = []
        print('RemovedSitesss>>', removed_sites, user_email)
        # delete_index_link.apply_async(args=[user_email, removed_sites])

        celery.send_task('tasks.delete_link', args=[user_email, removed_sites], kwargs={})

        return results



@app.route('/search')
def search():
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










    
