#!/bin/python2.7
import re

def bsearch(arr,element):
    start_index = 0
    last_index = len(arr)-1
    while (start_index <= last_index):
        mid =(int)(start_index+last_index)/2
        if (element>arr[mid]):
            start_index = mid+1
        elif (element<arr[mid]):
            last_index = mid-1
        elif (element == arr[mid]):
            return mid
    return -1


with open('TWL06.txt') as twl:
    dictionary = twl.readlines()

for i in range(len(dictionary)):
    dictionary[i] = dictionary[i].strip()

thirtyk = []
regex = re.compile(r'^([a-z]*)\t.*\n')

with open('count_1w.txt') as common:
    for line in common:

        line = regex.sub(r'\1', line)
        if bsearch(dictionary, line.upper()) != -1:
            print line
            thirtyk.append(line)
        
        if len(thirtyk) >= 50000:
            break

thirtyk.sort()

with open('mywords.json', 'w') as thelist:
    thelist.write('{"words":[')
    for i, line in enumerate(thirtyk):
        #print 'i',i
        if i:
            thelist.write(',')
        thelist.write('"%s"'%line)

    thelist.write(']}')