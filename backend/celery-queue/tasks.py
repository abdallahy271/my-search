import os
import hashlib
from elasticsearch import Elasticsearch

from celery import Celery
from search.index import scraper
from dotenv import load_dotenv

load_dotenv()

# Set up Celery
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379')
celery_client = Celery('tasks', broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)

# Set up ES
ELASTIC_USERNAME = os.environ.get('ES_USERNAME')
ELASTIC_PASSWORD = os.environ.get('ES_PASSWORD')
ELASTIC_HOST = os.environ.get('ES_HOST')

es_client = Elasticsearch(
    # "https://localhost:9200",
    hosts=[ELASTIC_HOST],
    scheme="https",
    port=443,
    http_auth=(ELASTIC_USERNAME, ELASTIC_PASSWORD),

)

# Successful response!
print('client_info', es_client.info())


def id_generator(user, url):
    #Since I am the only user, I only hash with the url but will later change to both url and user
    return hashlib.sha1(str.encode(user + url)).hexdigest()

    # return hashlib.sha1(str.encode(url)).hexdigest()



@celery_client.task(name='tasks.add_link')
def scrape_index_link(history, user_email):
    link = history['url']
    title = history['title']
    visitCount = history['visitCount']
    lastVisitTime = history['lastVisitTime']

    dic = scraper(link)
    full_dic = { 
            "user":user_email,
            "title": title,
            "lastVisitTime": lastVisitTime,
            "visitCount": visitCount,
            **dic,
         }

    id = id_generator(full_dic['user'],full_dic['url'])
    es_client.index(index='history', id=id, body=full_dic)

@celery_client.task(name='tasks.delete_link')
def delete_index_link(user_email, removed_sites):
    ids = [id_generator(user_email, site) for site in removed_sites]        
    query = {"query": {"terms": {"_id": ids}}}
    es_client.delete_by_query(index='history', body=query)

# @celery_client.task(name='tasks.search_link')
# def search_index_link(query, user_email, after, before):
#     body = {
#         "query": {
#             "bool": {
#                 "must": [
#                     {
#                         "range": {
#                             "lastVisitTime": {
#                                 "gte": after,
#                                 "lte": before
#                                     }
#                                 }
#                     },
#                     {
#                         "simple_query_string": 
#                             {
#                             "query": f"{query}*",
#                             "fields": ["content", "title", "url"],
#                             "analyze_wildcard": True,
#                             "default_operator":"AND"
#                             }
#                     },
#                     {
#                         "match": 
#                                 {
#                                 "user": user_email
#                                 }
#                     }
                    
#                 ]
#             }
#         }
#     }

#     res = es_client.search(index="history", body=body)
    
#     files = []
#     if len(res['hits']['hits']):
#         files = [dict(i['_source']) for i in res['hits']['hits'] ]

#     return files
