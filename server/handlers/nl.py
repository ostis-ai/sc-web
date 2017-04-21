# -*- coding: utf-8 -*-

import apiai
import json
import base
import decorators

import tornado.web

from keynodes import Keynodes, KeynodeSysIdentifiers
from sctp.logic import SctpClientInstance
from sctp.types import ScAddr, SctpIteratorType, ScElementType


import api_logic as logic


@decorators.class_logging
class NaturalLanguageSearch(base.BaseHandler):
    
    # @tornado.web.asynchronous
    def post(self):
        
        with SctpClientInstance() as sctp_client:
            
            keys = Keynodes(sctp_client)
            sc_session = logic.ScSession(self, sctp_client, keys)
            
            ai = apiai.ApiAI(tornado.options.options.apiai_client_access_token, tornado.options.options.apiai_subscription_key)
            request = ai.text_request()
            
            query = self.get_argument('query', u'')
            request.query = query.encode('utf-8')
            
            # TODO: make universal language selection
            keynode_lang_ru = keys[KeynodeSysIdentifiers.lang_ru]
            used_lang = sc_session.get_used_language()
            if (used_lang == keynode_lang_ru):
                request.lang = 'ru' 
            else:
                request.lang = 'en'
        
            response = request.getresponse()

            result = '[]'
            apiRes = json.loads(response.read())
            actionResult = apiRes['result']
            cmd_addr = sctp_client.find_element_by_system_identifier(str(actionResult['action']))
            if cmd_addr:
                arguments = []
                
                parameters = actionResult['parameters']
                                    
                idx = 1
                found = True
                while found:
                    key = 'ui_arg_%d' % idx
                    idx = idx + 1
                    found = False
                    try:
                        arg_addr = logic.get_by_identifier_translated(used_lang, keys, sctp_client, str(parameters[key].encode('utf-8')))
                        if arg_addr is not None:
                            arguments.append(arg_addr)
                            found = True

                    except KeyError:
                        break
            
                result = logic.do_command(sctp_client, keys, cmd_addr, arguments, self)
 
                
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(result))
