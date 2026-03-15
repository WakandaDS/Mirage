import re

with open("/Volumes/bruno/TokenMirage/src/ui/js/04-compare.js", "r") as f:
    lines = f.readlines()

def write_out(filename, start_marker, end_marker=None):
    out = []
    started = False
    for line in lines:
        if start_marker in line:
            started = True
        if started and end_marker and end_marker in line:
            break
        if started:
            out.append(line)
    
    with open(f"/Volumes/bruno/TokenMirage/src/ui/js/compare/{filename}", "w") as f:
        f.write("".join(out))

# We will just write manual sections because they are well defined.
