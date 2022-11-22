from whoosh.fields import Schema, TEXT, ID
import os, os.path
from whoosh import index, qparser
import requests
from bs4 import BeautifulSoup
from bs4.element import Comment
import requests




def tag_visible(element):
    if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
        return False
    if isinstance(element, Comment):
        return False
    return True


def text_from_html(body):
    soup = BeautifulSoup(body, 'html.parser')
    texts = soup.findAll(text=True)
    visible_texts = filter(tag_visible, texts)  
    return u" ".join(t.strip() for t in visible_texts)


def scraper(url):
    article=dict()
    # article = simple_json_from_html_string(req.text, use_readability=True)
    html = requests.get(url).content
    article['url'] = url
    article['content'] = text_from_html(html)
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

