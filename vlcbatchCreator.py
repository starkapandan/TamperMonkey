Name = "Ex On The Beach"
links = []
f = open("linklist.txt", "r")
tmp = f.read()
links = tmp.split("\n")
f.close()
f = open("GeneratedBatchJob.bat", "w")
linksdupcheck = set(links)
if len(links) != len(linksdupcheck):
    print("WARNING DUPLICATES")
for i in range(len(links)):
    if len(links[i]) < 5:
        continue
    f.write(
        'CALL "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe" -I dummy -vvv "' +
        links[i] + '" --file-caching=300 --sout=#transcode{vcodec="h264",acodec="mpga",ab="128","channels=2",samplerate="44100"}:standard{access="file",mux="mp4",dst="' + Name + " - " + str(
            i + 1) + '.mp4"} vlc://quit' + "\n"
    )
f.close()
