import multiprocessing
import os
import struct

import tornado.options

from sc_client import client
from sc_client.constants.sc_types import EDGE_ACCESS_VAR_POS_PERM, NODE_CONST_CLASS, NODE_VAR_CLASS
from sc_client.models import ScTemplate, ScAddr
from sc_client.sc_keynodes import ScKeynodes

from keynodes import KeynodeSysIdentifiers
from handlers import api_logic as logic

import time
import concurrent.futures

from progress.bar import IncrementalBar


def get_languages():
    founded_langs = []
    keys = ScKeynodes()
    template = ScTemplate()
    template.triple(
        keys[KeynodeSysIdentifiers.languages.value],
        EDGE_ACCESS_VAR_POS_PERM,
        NODE_VAR_CLASS
    )
    languages_iter = client.template_search(template)
    if not languages_iter:
        print(f"Natural languages not found in KB")
        return founded_langs
    for lang_iter in languages_iter:
        founded_langs.append(lang_iter.get(2))
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
                future.result()
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
            offset, seg = struct.unpack('=HH', addr)
            decoded_addr = ScAddr(seg << 16 | offset)
            if decoded_addr and decoded_addr.is_valid():
                self.addr.append(decoded_addr)
            byte_border += 4

    def sorter(self, languages, node_addr):
        keys = ScKeynodes()
        link_content = client.get_link_content(node_addr)[0]
        if not link_content.data:
            return
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
