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
[Find Extensions on Google Chrome](./assets/find_ext.png)

### Select "load unpacked"
[Select load unpacked](./assets/load_unpacked.png)

### Select the build file inside /mysearch/frontend/ to add MySearch to your list of extensions
[Choose the build file inside](./assets/mysearch_dp.png)

### Click MySearch in the list of extensions
[Click MySearch in the list of extensions](./assets/mysearch_pin.png)

### Start using MySearch
[Start using MySearch](./assets/mysearch_app.png)

