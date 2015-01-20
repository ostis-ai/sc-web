from sqlalchemy import Column, ForeignKey, Integer, TIMESTAMP, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import tornado.options
import time, datetime, uuid

Base = declarative_base()

class Role(Base):
    __tablename__ = 'role'
    id = Column(Integer, primary_key = True)
    rights = Column(Integer)
    name = Column(String(128), unique = True)

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key = True, unique = True)
    name = Column(String(255), nullable = False)
    email = Column(String(255), nullable = False, unique = True)
    avatar = Column(String(1024))
    addr = Column(Integer, nullable = False, unique = True)
    key = Column(String(32), nullable = False, unique = True)
    role = Column(Integer)


class DataBase:
    
    def __init__(self):
        self.engine = create_engine('sqlite:///' + tornado.options.options.db_path)
        self.session = None
        
    def __del__(self):
        pass
    
    def init(self):
        Base.metadata.create_all(self.engine)
        
        names = {0x00: 'guest', 0x77: 'editor', 0xff: 'super'}
        
        for i in xrange(256):
            n = None
            try:
                n = names[i]
            except:
                pass
            
            role = Role(id = i, rights = i, name = n)
            self._session().merge(role)
        self._session().commit()
        
    def _session(self):
        if not self.session:
            self.session = sessionmaker(bind = self.engine)()
        return self.session
    
    def create_user_key(self):
        return unicode(uuid.uuid4()) + unicode(int(time.time()))
    
    def new_expire_time(self):
        return datetime.date.fromtimestamp(time.time() + tornado.options.options.user_key_expire_time)
    
    def get_role_by_name(self, name):
        return self._session().query(Role).filter(Role.name == name).first()
    
    def get_user_by_email(self, email):
        return self._session().query(User).filter(User.email == email).first()
    
    def get_user_by_key(self, key):
        return self._session().query(User).filter(User.key == key).first()
    
    def get_user_rights(self, u):
        res = 0
        r = self._session().query(Role).filter(Role.id == u.role).first()
        if r:
            res = r.rights
        return res
    
    def update_user(self, u):
        self._session().merge(u)
        self._session().commit()
    
    def add_user(self, name, email, addr, avatar = None, role = 0):
        key = self.create_user_key()
        new_user = User(name = unicode(name), 
                        email = unicode(email), 
                        addr = addr,
                        avatar = unicode(avatar),
                        key = key,
                        role = role)
        self._session().add(new_user)
        self._session().commit()
        
        return key
    
        