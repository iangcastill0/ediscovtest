###########################################################################
# Script Name: NFS Snapshot Comparison Script
# Description: Utility for comparing NFS snapshots and generating a report
#              of changed files between two snapshots.
# Author: Dmytro Boiko
# Copyright (c) 2023 Global Digital Forensics. All rights reserved.
###########################################################################

import os
import fnmatch
import datetime
import csv
import hashlib
import filecmp
from pathlib import Path
from multiprocessing import Pool, Lock
import time

# Define lock for process synchronization
csv_lock = Lock()
log_lock = Lock()

def find_matching_directories(directory, pattern, recurse_level=-1):
    """
    Recursively finds directories matching the given pattern in the specified directory and its subdirectories.
    The recursion stops when it reaches the specified depth.
    """
    matches = []
    try:
        if recurse_level == 0:
            return matches
        for entry in os.scandir(directory):
            if entry.is_dir() and fnmatch.fnmatch(entry.name, pattern):
                print(f"Found directory: {entry.path}")
                matches.append(entry.path)
            elif entry.is_dir():
                print(f"Checking directory: {entry.path}")
                sub_matches = find_matching_directories(entry.path, pattern, recurse_level - 1)
                matches.extend(sub_matches)
    except Exception as e:
        with log_lock:
            with open("logs.txt", 'a') as log_file:
                log_file.write(f"Error occurred in find_matching_directories: {str(e)}\n")
    return matches

def find_matching_files(directory, pattern, start_date, end_date):
    """
    Recursively finds files matching the given pattern in the specified directory.
    """
    matches = []
    print("Find matching files from ", directory)
    for root, dirnames, filenames in os.walk(directory):
        for filename in fnmatch.filter(filenames, pattern):
            try:
                filepath = os.path.join(root, filename)
                print(f"Checking file: {filepath}", end='\r')
                print()
                stat = os.stat(filepath)
                modified_time = datetime.datetime.fromtimestamp(stat.st_mtime)
                if start_date <= modified_time <= end_date:
                    matches.append(filepath)
            except Exception as e:
                with log_lock:
                    with open("logs.txt", 'a') as log_file:
                        log_file.write(f"Error occurred in find matching files: {str(e)}\n")
                
    return matches

def compare_two_snapshots(args):
    snapshot1, snapshot2, snapshot1_path, snapshot2_path, directory_pattern, filename_pattern, start_date, end_date, output_file, hash_check, byte_check, recurse_level = args
    matched_dirs1 = find_matching_directories(snapshot1_path, directory_pattern, recurse_level)
    matched_dirs2 = find_matching_directories(snapshot2_path, directory_pattern, recurse_level)
    print()
    print("Matched Directories1: ", matched_dirs1)
    print("Matched Directories2: ", matched_dirs2)
   
    max_len = min(len(matched_dirs1), len(matched_dirs2))

    try:
        for i in range(max_len):
            dir1 = matched_dirs1[i]
            dir2 = matched_dirs2[i]
            modified_files = []
            deleted_files = []
            new_files = []
            try:
                for root, dirnames, filenames in os.walk(dir1):
                    for filename in fnmatch.filter(filenames, filename_pattern):
                        file_path1 = os.path.join(root, filename)
                        file_path2 = os.path.join(dir2, os.path.relpath(file_path1, dir1))
                        print(f"Comparing files {file_path1} and {file_path2}")
                        if os.path.exists(file_path2):
                            stat1 = os.stat(file_path1)
                            stat2 = os.stat(file_path2)
                            if stat1.st_size != stat2.st_size or stat1.st_mtime != stat2.st_mtime:
                                modified_files.append(file_path2)
                            elif hash_check:
                                hash1 = get_file_hash(file_path1)
                                hash2 = get_file_hash(file_path2)
                                if hash1 != hash2:
                                    modified_files.append(file_path2)
                            elif byte_check:
                                if not filecmp.cmp(file_path1, file_path2, shallow=False):
                                    modified_files.append(file_path2)
                        else:
                            deleted_files.append(file_path1)

                # Check for new files in dir2
                for root, dirnames, filenames in os.walk(dir2):
                    for filename in fnmatch.filter(filenames, filename_pattern):
                        file_path2 = os.path.join(root, filename)
                        file_path1 = os.path.join(dir1, os.path.relpath(file_path2, dir2))
                        print(f"Checking new files {file_path2} and {file_path1}")
                        if not os.path.exists(file_path1):
                            new_files.append(file_path2)
            except Exception as e:
                with log_lock:
                    with open("logs.txt", 'a') as log_file:
                        log_file.write(f"Error os walking during comparison: {str(e)}\n")

                    # Write results to CSV file
            batch = []
            
            for file_path in new_files:
                modified_time = datetime.datetime.fromtimestamp(os.stat(file_path).st_mtime).strftime('%m/%d/%Y, %H:%M:%S')
                last_access_time = datetime.datetime.fromtimestamp(os.stat(file_path).st_atime).strftime('%m/%d/%Y, %H:%M:%S')
                created_time = datetime.datetime.fromtimestamp(os.stat(file_path).st_ctime).strftime('%m/%d/%Y, %H:%M:%S')
                filesize = os.stat(file_path).st_size
                batch.append([os.path.basename(file_path), f'{matched_dirs1[i]} -> {matched_dirs2[i]}', 'New File', file_path, created_time, modified_time, last_access_time, str(filesize)])

            for file_path in deleted_files:
                modified_time = datetime.datetime.fromtimestamp(os.stat(file_path).st_mtime).strftime('%m/%d/%Y, %H:%M:%S')
                last_access_time = datetime.datetime.fromtimestamp(os.stat(file_path).st_atime).strftime('%m/%d/%Y, %H:%M:%S')
                created_time = datetime.datetime.fromtimestamp(os.stat(file_path).st_ctime).strftime('%m/%d/%Y, %H:%M:%S')
                filesize = os.stat(file_path).st_size
                batch.append([os.path.basename(file_path), f'{matched_dirs1[i]} -> {matched_dirs2[i]}', 'Deleted File', file_path, created_time, modified_time, last_access_time, str(filesize)])

            for file_path in modified_files:
                modified_time = datetime.datetime.fromtimestamp(os.stat(file_path).st_mtime).strftime('%m/%d/%Y, %H:%M:%S')
                last_access_time = datetime.datetime.fromtimestamp(os.stat(file_path).st_atime).strftime('%m/%d/%Y, %H:%M:%S')
                created_time = datetime.datetime.fromtimestamp(os.stat(file_path).st_ctime).strftime('%m/%d/%Y, %H:%M:%S')
                filesize = os.stat(file_path).st_size
                batch.append([os.path.basename(file_path), f'{matched_dirs1[i]} -> {matched_dirs2[i]}', 'Modified File', file_path, created_time, modified_time, last_access_time, str(filesize)])
            if len(batch) > 0:    
                with csv_lock:
                    with open(output_file, 'a', newline='') as csvfile:
                        writer = csv.writer(csvfile)
                        writer.writerows(batch)

    except Exception as e:
        with log_lock:
            with open("logs.txt", 'a') as log_file:
                log_file.write(f"Error occurred during comparison: {str(e)}\n")

def get_file_hash(file_path):
    """
    Computes the MD5 hash of a file and reports progress with a line of dashes and the percentage.
    """
    file_size = file_path.stat().st_size
    processed_bytes = 0

    with open(file_path, 'rb') as file:
        md5_hash = hashlib.md5()
        while True:
            data = file.read(4096)
            if not data:
                break
            md5_hash.update(data)
            processed_bytes += len(data)

            progress = (processed_bytes / file_size) * 100
            dashes_count = int(progress / 5)

            print(f"Progress: [{'-' * dashes_count}{' ' * (20 - dashes_count)}] {progress:.2f}%", end='\r')

    print()  # Print a newline to move to the next line after completing the progress

    return md5_hash.hexdigest()

def compare_snapshots(snapshot_dir, directory_pattern, filename_pattern, start_date, end_date, process_count, output_file, hash_check, byte_check, recurse_level):
    snapshots = sorted(entry for entry in Path(snapshot_dir).iterdir() if entry.is_dir())
    if not snapshots:
        print("No snapshots found in the directory.")
        return

    print(f"Comparing snapshots from {start_date.strftime('%m/%d/%Y')} to {end_date.strftime('%m/%d/%Y')}:")
    print()

    with Pool(processes=process_count) as pool:
        args_list = []
        for i in range(len(snapshots) - 1):
            snapshot1 = snapshots[i]
            snapshot2 = snapshots[i + 1]
            snapshot1_path = Path(snapshot_dir) / snapshot1
            snapshot2_path = Path(snapshot_dir) / snapshot2
            args_list.append(
                (snapshot1, snapshot2, snapshot1_path, snapshot2_path, directory_pattern, filename_pattern, start_date,
                 end_date, output_file, hash_check, byte_check, recurse_level)
            )
        pool.map(compare_two_snapshots, args_list)

    print("Comparison complete.")

def parse_date(date_string):
    """
    Parses the date string in the format MM/DD/YYYY and returns a datetime object.
    """
    try:
        month, day, year = map(int, date_string.split('/'))
        return datetime.datetime(year, month, day)
    except ValueError:
        raise argparse.ArgumentTypeError("Invalid date format. Please use MM/DD/YYYY.")

# Get the current timestamp
timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')

print()
print()
print("************************************************************************")
print("* Script Name: NFS Snapshot Comparison Script                         *")
print("* Description: Utility for comparing NFS snapshots and generating a   *")
print("*              report of changed files between two snapshots.         *")
print("* Author: Global Digital Forensics                                    *")
print("* Copyright (c) 2023 Global Digital Forensics. All rights reserved.   *")
print("************************************************************************")
print()
print()
time.sleep(3)

if __name__ == '__main__':
    import argparse

    description = """
        Utility for comparing NFS snapshots and generating a report of changed files.\n\n
        Author: Global Digital Forensics\n\n
        Copyright (c) 2023 Global Digital Forensics. All rights reserved.\n\n
    """
    
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument('snapshot_path', help='Path to the NFS snapshot directory')
    parser.add_argument('directory_wildcard_pattern', help='Wildcard pattern to match directories')
    parser.add_argument('file_wildcard_pattern', help='Wildcard pattern to match filenames')
    parser.add_argument('--start_date', type=parse_date, default='01/01/1901', help='Start date for comparison (MM/DD/YYYY)')
    parser.add_argument('--end_date', type=parse_date, default='01/01/2199', help='End date for comparison (MM/DD/YYYY)')
    parser.add_argument('--process_count', type=int, default=8, help='Number of processes for concurrent processing')
    parser.add_argument('--output_file', default=f'result_{timestamp}.csv', help='Output CSV file path')
    parser.add_argument('--hash_check', action='store_true', help='Check content of files by hash')
    parser.add_argument('--byte_check', action='store_true', help='Check content of files by bytes')
    parser.add_argument('--recurse_level', type=int, default=-1, help='Level of directory recursion (-1 for infinite recursion)')

    args, unknown = parser.parse_known_args()

    snapshot_dir = args.snapshot_path
    directory_pattern = args.directory_wildcard_pattern 
    filename_pattern = args.file_wildcard_pattern
    start_date = args.start_date
    end_date = args.end_date
    process_count = args.process_count
    output_file = args.output_file
    hash_check = args.hash_check
    byte_check = args.byte_check
    recurse_level = args.recurse_level

    with open(output_file, 'a', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['FileName', 'Comparison', 'Type', 'Path', 'Created Time', 'Modified Time', 'Last Access Time', 'File Size'])

    compare_snapshots(snapshot_dir, directory_pattern, filename_pattern, start_date, end_date, process_count, output_file, hash_check, byte_check, recurse_level)
