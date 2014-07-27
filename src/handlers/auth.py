import tornado.auth
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

import base 

# class AuthLoginHandler(base.BaseHandler, tornado.auth.GoogleMixin):
#     @tornado.web.asynchronous
#     def get(self):
#         if self.get_argument("openid.mode", None):
#             self.get_authenticated_user(self.async_callback(self._on_auth))
#             return
#         self.authenticate_redirect()
# 
#     def _on_auth(self, user):
#         if not user:
#             raise tornado.web.HTTPError(500, "Google auth failed")
#         author = self.db.get("SELECT * FROM authors WHERE email = %s",
#                              user["email"])
#         if not author:
#             # Auto-create first author
#             any_author = self.db.get("SELECT * FROM authors LIMIT 1")
#             if not any_author:
#                 author_id = self.db.execute(
#                     "INSERT INTO authors (email,name) VALUES (%s,%s)",
#                     user["email"], user["name"])
#             else:
#                 self.redirect("/")
#                 return
#         else:
#             author_id = author["id"]
#         self.set_secure_cookie("blogdemo_user", str(author_id))
#         self.redirect(self.get_argument("next", "/"))