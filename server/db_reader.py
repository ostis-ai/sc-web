import multiprocessing
import os

import tornado.options

from sc_client import client
from sc_client.sc_keynodes import ScKeynodes

from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.logic import SctpClientInstance
from sctp.types import ScAddr, SctpIteratorType, ScElementType
from handlers import api_logic as logic

import time
import concurrent.futures

from progress.bar import IncrementalBar


def get_languages():
    founded_langs = []
    try:
        with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)
            languages_iter = sctp_client.iterate_elements(
                SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                keys[KeynodeSysIdentifiers.languages],
                ScElementType.sc_type_arc_pos_const_perm,
                ScElementType.sc_type_node_class | ScElementType.sc_type_const
            )
            if not languages_iter:
                print(f"Natural languages not found in KB")
                return founded_langs
            for lang_iter in languages_iter:
                founded_langs.append(lang_iter[2])
    except BrokenPipeError as e:
        quit()
    return founded_langs


class Reader:
    long_content = None

    def __init__(self):
        self.sys = []
        self.main = []
        self.common = []
        self.addr = []
        self.long_content_counter = 0
        self.content_len_max = 200
        self.fm_path = os.path.abspath(tornado.options.options.fm_path)

    def read_from_file(self):
        """read db and fill self.sys, self.main and self.common lists by addrs"""
        print("Reading db ...")

        time_start = time.perf_counter()
        self.form_addr_list()
        bar = IncrementalBar("Processing", max=100, suffix='%(percent)d%%')
        index = 0
        progress = int(len(self.addr) // 100)
        optimal_threads_count = 2 * multiprocessing.cpu_count() + 1
        languages = get_languages()
        with concurrent.futures.ThreadPoolExecutor(max_workers=optimal_threads_count) as executor:
            future_sort = {executor.submit(self.sorter, languages, addr): addr for addr in self.addr}
            for future in concurrent.futures.as_completed(future_sort):
                try:
                    index += 1
                    if index == progress:
                        bar.next()
                        index = 0
                except Exception as exc:
                    pass

        bar.finish()
        time_end = time.perf_counter()
        time_taken = round(time_end - time_start, 2)
        loaded_elems = len(self.sys) + len(self.main) + len(self.common)
        print(f"{loaded_elems} elems loaded in {time_taken} second(s)")

    def form_addr_list(self):
        with open(self.fm_path, "rb") as file:
            encoded_addrs = file.read()
        byte_border = 0
        while byte_border < len(encoded_addrs):
            addr = encoded_addrs[byte_border: byte_border + 4]
            decoded_addr = ScAddr.parse_binary(addr)
            if decoded_addr and decoded_addr.to_int() != 0:
                self.addr.append(decoded_addr)
            byte_border += 4

    def get_languages(self):
        try:
            keys = ScKeynodes()
            lang_en = keys[KeynodeSysIdentifiers.lang_en.value]
            lang_ru = keys[KeynodeSysIdentifiers.lang_ru.value]
            return [lang_en, lang_ru]
        except BrokenPipeError as e:
            quit()

    def sorter(self, languages, node_addr):
        keys = ScKeynodes()
        link_content = client.get_link_content(node_addr)[0]
        if len(link_content.data) > self.content_len_max:
            self.long_content_counter += 1
            return
        link_content_decoded = link_content.data
        idtf_addr = logic.get_by_link_addr(keys, node_addr)
        if idtf_addr is not None:
            self.sys.append([idtf_addr.value, link_content_decoded])
            return
        for lang in languages:
            idtf_addr = logic.get_by_link_addr_translated(lang, keys, node_addr)
            if idtf_addr:
                self.main.append([idtf_addr.value, link_content_decoded])
            else:
                self.common.append([node_addr.value, link_content_decoded])

    def update(self):
        # call after changing db
        # should update lists for searching new elems
        pass
