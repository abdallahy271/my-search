# MySearch

## For Development:

### Start Elasticsearch

Install Elasticsearch: https://www.elastic.co/guide/en/elasticsearch/reference/current/install-elasticsearch.html

Then,
```
cd elasticsearch-8.4.3

./bin/elasticsearch
```

### Start Kibana

Install Kibana: https://www.elastic.co/guide/en/kibana/current/install.html

```
cd kibana-8.4.3

./bin/kibana
```

### Install all packages

```
cd my-search/backend
python3 -m venv venv/bin/activate
source venv/bin/activate
pip3 install -r requirements.txt
```

Check if redis is installed
```redis-cli```

### Start Celery
```
celery -A app.celery_client worker --loglevel=info
```

### Start Flower
```
celery -A app.celery_client flower --port=5555
```

### Start Flask
```
flask run
```

### Create a React build
```
npm build
```


## Test Chrome Extension

### Find Extensions on Google Chrome
### Select load unpacked
### Choose the build file inside /mysearch/frontend/
### Click MySearch in the list of extensions
### Start using MySearch
