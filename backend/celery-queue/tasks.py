import os
import hashlib
from elasticsearch import Elasticsearch, RequestsHttpConnection

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
    hosts=[ELASTIC_HOST],
    scheme="https",
    http_auth=(ELASTIC_USERNAME, ELASTIC_PASSWORD),
    use_ssl=True,
    verify_certs=True,
    connection_class= RequestsHttpConnection
)

# Successful response!
print('client_info', es_client.info())


def id_generator(user, url):
    return hashlib.sha1(str.encode(user + url)).hexdigest()


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