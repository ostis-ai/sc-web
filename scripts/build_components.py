import sys, os
from optparse import OptionParser
import json, shutil


BUILD_FILE = "build.json"
COMPONENTS_PATH = "../components"
CLIENT_PATH = "../client/"


def copy_replace(src, dst):
    for src_dir, dirs, files in os.walk(src):
        dst_dir = src_dir.replace(src, dst)
        if not os.path.exists(dst_dir):
            os.mkdir(dst_dir)
    
        for file_ in files:
            src_file = os.path.join(src_dir, file_)
            dst_file = os.path.join(dst_dir, file_)
            if os.path.exists(dst_file):
                os.remove(dst_file)
            shutil.copy2(src_file, dst_dir)

def create_file(build_file, integrated):
    path, fn = os.path.split(build_file)

    f = open(build_file)
    config = json.load(f)
    f.close()

    p = CLIENT_PATH
    if not integrated: 
        p = path
    target_file_path = os.path.join(path, config['target'])
    if integrated and config.has_key('component'):
        comp = config['component']
        if (isinstance(comp, list)):
            config['sources'].extend(comp)
        else:
            config['sources'].append(comp)

    lines = []
    for src in config['sources']:
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


def build_component(descr, integrated):
    build_file = descr[1]
    print "Building %s" % build_file
    create_file(build_file, integrated)

    path, fn = os.path.split(build_file)
    src = os.path.join(path, 'static')
    dst = os.path.join(CLIENT_PATH, 'static')
    print "Copy %s to %s" % (src, dst)
    copy_replace(src, dst)
    

def find_components(path):
    
    res = {}
    names = os.listdir(path)
    for n in names:
        cmp_path = os.path.join(path, n)
        if os.path.isdir(cmp_path):
            build_path = os.path.join(cmp_path, BUILD_FILE)
            if os.path.isfile(build_path):
                res[n] = (cmp_path, build_path)
                
    return res

def build(options):
    if options.all or options.component is None:
        components = find_components(options.input_path)
        for k, v in components.iteritems():
            print "--- Process %s ---" % k
            build_component(v, options.integrated)
            print "--- Finished ---"
            
    else:
        cmp_path = os.path.join(options.input_path, options.component)
        build_file = os.path.join(cmp_path, BUILD_FILE)
        if os.path.isfile(build_file):
            build_component((cmp_path, build_file), options.integrated)
        else:
            print "Error: Can't find %s" % build_file


if __name__ == '__main__':

    parser = OptionParser()
    parser.add_option("-p", "--path", dest="input_path", default=COMPONENTS_PATH, help="Path to components directory")
    parser.add_option("-i", "--integrated", dest="integrated", action="store_true", help="Flag to build component integration to sc-web")
    parser.add_option("-c", "--component", dest="component", default=None, type="string", help="Name of component to build")
    parser.add_option("-a", "--all", dest="all", action="store_true", help="Build all components")

    (options, sys.argv) = parser.parse_args()
    
    build(options)