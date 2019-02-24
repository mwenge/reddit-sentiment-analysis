# -*- coding: utf-8 -*-
"""

Read original comment data in .bz2 JSON format and compute sentiment score.
Write sentiment data to tab-separated file.
Print current comment count every 1000 comments.

Based on: https://github.com/megansquire/masteringDM/blob/master/ch5/scoreLinusEmail.py by megan

Use nltkDownload.py first to download the required data files for sentiment analysis.

Needs a python with some extras - you can use the community edition of Anaconda:
https://www.continuum.io/downloads

"""
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk import tokenize

import bz2
import json
import sys
import os.path
import datetime
import concurrent.futures
import itertools

sid = SentimentIntensityAnalyzer()
def processFile(archive, filename):
    archive_name = archive[0] + os.sep + archive[1]
    if not archive_name.endswith('bz2'):
        return

    bz_file = bz2.BZ2File(archive_name, 'rb', 1000000)
    score_file = open(archive[0] + os.sep + filename + ".txt", 'w')

    commentCount = 0
    while True:
        line = bz_file.readline().decode('utf8')
        if len(line) == 0:
            break
        comment = json.loads(line)
        # print(comment)
        id = comment["id"]
        body = comment["body"]
        subreddit = comment["subreddit"].strip()
        created = datetime.datetime.fromtimestamp(int(comment["created_utc"])).strftime("%Y-%m-%d %H:%M:%S").strip()

        # variables to hold the overall average compound score for message
        finalScore = 0
        roundedFinalScore = 0

        # variables to hold the highest positive score in the message
        # and highest negative score in the message
        maxPosScore = 0
        maxNegScore = 0

        # print("===")
        commentLines = tokenize.sent_tokenize(body)
        for line in commentLines:
            ss = sid.polarity_scores(line)
            # uncomment these lines if you want to print out sentences & scores
            '''
            line = line.replace('\n', ' ').replace('\r', '')
            print(line)
            for k in sorted(ss):
                print(' {0}: {1}\n'.format(k,ss[k]), end='')
            '''
            lineCompoundScore = ss['compound']
            finalScore += lineCompoundScore

            if ss['pos'] > maxPosScore:
                maxPosScore = ss['pos']
            elif ss['neg'] > maxNegScore:
                maxNegScore = ss['neg']

        # roundedFinalScore is the average compound score for the entire message
        commentLength = len(commentLines)
        if commentLength == 0:
            commentLength = 1
        roundedFinalScore = round(finalScore / commentLength, 4)
        score_file.write("{0}\t{1}\t{2}\r\n".format(roundedFinalScore, subreddit, created))
        commentCount += 1
        if commentCount % 1000 == 0:
            print(commentCount)
            # break
    bz_file.close()
    score_file.close()
    return filename + ".txt"

commentsdir = "./comments/"
for subdir, dirs, files in os.walk(commentsdir):
    with concurrent.futures.ProcessPoolExecutor() as executor:
        executor.map(processFile, zip(itertools.repeat(subdir), files), files)
