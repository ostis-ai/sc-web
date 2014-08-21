"""
Concatenates all js files from specified directory to the single js file.
Usage example:
concatenate_js.py <path to build file json> <flag to build component interface>
"""
import sys, os
import simplejson as json

def create_file(build_file, build_component):

    path, fn = os.path.split(build_file)
    
    f = open(build_file)
    config = json.load(f)
    f.close()
    
    target_file_path = os.path.join(path, config['target'])
    if build_component == 1 and config.has_key('component'):
        config['sources'].append(config['component'])

    lines = []
    for src in config['sources']:
        print src
        lines.append("/* --- %s --- */\n" % src)
        f = open(os.path.join(path, src), 'r')
        lines.extend(f.readlines())
        f.close()
        lines.append("\n\n")

    print "Write file: %s" % target_file_path
    target_dir = '/'.join(target_file_path.split('/')[:-1])
    if not os.path.isdir(target_dir) and len(target_dir) > 0:
        os.makedirs(target_dir)

    concatenated_file = open(target_file_path, 'w')
    concatenated_file.writelines(lines)
    concatenated_file.close()

if __name__ == '__main__':
    if len(sys.argv) > 2:
        create_file(sys.argv[1], int(sys.argv[2]))
    else:
        create_file(sys.argv[1], 0)
