# -*- coding: utf-8 -*-

import logging
import re
from glob import glob
from os.path import exists, splitext, join, dirname, abspath, isdir, commonprefix, isfile

from sc_client import client

logger = logging.getLogger()

REPO_FILE_EXT = ".path"

scs_paths = set()
scs_exclude_paths = set()


def search_kb_sources(root_path: str):
    if not exists(root_path):
        logger.error(f"{root_path} does not exist")
        exit(1)

    elif splitext(root_path)[1] == REPO_FILE_EXT:
        logger.debug(f"{root_path} has the correct extension \'{REPO_FILE_EXT}\'")
        with open(join(root_path), 'r', encoding='utf-8') as root_file:
            logger.debug(f"Opening {root_path}")
            for line in root_file.readlines():
                # ignore comments and empty lines
                line = line.replace('\n', '')
                # note: with current implementation, line is considered a comment if it's the first character
                # in the line
                if line.startswith('#') or re.match(r"^\s*$", line):
                    continue
                elif line.startswith('!'):
                    absolute_path = abspath(join(dirname(root_path), line[1:]))
                    logger.debug(f"Excluding {absolute_path} from KB building")
                    scs_exclude_paths.add(absolute_path)
                else:
                    absolute_path = abspath(join(dirname(root_path), line))
                    # ignore paths we've already checked
                    if absolute_path not in scs_paths:
                        # recursively check each repo entry
                        search_kb_sources(absolute_path)

    else:
        logger.debug(f"Including {root_path} in KB building")
        scs_paths.add(root_path)

    return scs_paths, scs_exclude_paths


# read scs fragments unless they are excluded by repo.path
def read_scs_fragments(root_path: str):
    scs_fragments = []
    paths, exclude_paths = search_kb_sources(root_path)
    for path in paths:
        # search for all scs in all subfolders of a path
        if isdir(path):
            for filename in glob(path + '/**/*.scs', recursive=True):
                excluded = False

                # check if it's inside excluded paths
                for path in exclude_paths:
                    if commonprefix([filename, path]) == path:
                        excluded = True

                if excluded:
                    continue
                else:
                    with open(filename, 'r', encoding='utf-8') as f:
                        scs_fragments.append(f.read())

        elif isfile(path) and splitext(path)[1] == '.scs':
            if path not in exclude_paths:
                with open(path, 'r', encoding='utf-8') as f:
                    scs_fragments.append(f.read())

        elif not exists(path):
            logger.error(f"Read scs-fragments: {path} does not exist")
            exit(1)

        else:
            continue

    return scs_fragments


def load_scs_fragments(root_path: str):
    client.generate_elements_by_scs(read_scs_fragments(root_path))
