import tornado

class BaseHandler(tornado.web.RequestHandler):
    
    @property
    def db(self):
        self.application.settings
#         if not hasattr(self, '_db'):
#             self._db = asyncmongo.Client(
#                 pool_id='uglyweb',
#                 host=self.application.settings['db_host'],
#                 port=self.application.settings['db_port'],
#                 dbname=self.application.settings['db_name']
#             )
#         return self._db
        return None