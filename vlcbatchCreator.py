Name = "Ex On The Beach"
TagName = "s1e" #adds before i "name - <tagname>i"
inputListName = "linklist - s1.txt"
outputBatchName = "GeneratedBatchJob (" + inputListName + ")"
totalLinksInOneBatchJob = 100
links = []
f = open(inputListName, "r")
tmp = f.read()
links = tmp.split("\n")
f.close()
linksdupcheck = set(links)
if len(links) != len(linksdupcheck):
    print("WARNING DUPLICATES")

batchPart = 1
f = open(outputBatchName + " - " + str(batchPart) +".bat", "w")
CurrentBatchSampleCount = 0
for i in range(len(links)):
    if len(links[i]) < 5:
        continue
    f.write(
        'ffmpeg -i "' + links[i] + '" -c copy -bsf:a aac_adtstoasc "' + Name + " - " + str(i + 1) + '.mp4"' + "\n"
    )
    CurrentBatchSampleCount += 1
    if(CurrentBatchSampleCount == totalLinksInOneBatchJob):
        batchPart += 1
        CurrentBatchSampleCount = 0
        f = f = open(outputBatchName + " - " + str(batchPart) +".bat", "w")
f.close()

