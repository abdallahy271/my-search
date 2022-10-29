from whoosh.fields import Schema, TEXT, ID
import os, os.path
from whoosh import index, qparser

import requests
from bs4 import BeautifulSoup



def scraper(url):

    req = requests.get(url)
    article=dict()
    # article = simple_json_from_html_string(req.text, use_readability=True)
    article['url'] = url
    article['content'] = BeautifulSoup(req.text, "html.parser").text.strip().replace('\n', '')
    return article




# def write_content(df):
#     schema = Schema(title=TEXT(stored=True), path=TEXT(stored=True), content=TEXT(stored = True))

#     # create empty index directory

#     if not os.path.exists("index_dir"):
#         os.mkdir("index_dir")

#     ix = index.create_in("index_dir", schema)
#     writer = ix.writer()


#     writer.add_document(title=str(df['title']), content=str(df['content']),
#                     path=df['url'])
#     writer.commit()

# def index_search(dirname, search_fields, search_query):
#     ix = index.open_dir(dirname)
#     schema = ix.schema
    
#     og = qparser.OrGroup.factory(0.9)
#     mp = qparser.MultifieldParser(search_fields, schema, group = og)

    
#     q = mp.parse(search_query)
    
#     with ix.searcher() as s:
#         results = s.search(q, terms=True, limit = 10)
#         print("Search Results: ")
        
#         print(results[0:10])
    


# if __name__ == '__main__':
#     # url = 'https://techcrunch.com/2022/09/29/google-colaboratory-launches-a-pay-as-you-go-option-premium-gpu-access/'
#     url = 'https://github.com/abdallahy271'

#     dic = scraper(url)

#     write_content(dic)

#     results_dict = index_search("index_dir", ['title','content'], u"actions")

