import csv
from datetime import datetime, timedelta
import argparse

html_start = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Visualization</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f8f8f8;
            padding: 20px;
        }
        .message {
            background-color: #fff;
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 5px;
        }
        img {
            max-width: 100%;
        }
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <h1>Chat Visualization</h1>
    <div id="chat-content">
"""

html_end = """
    </div>
</body>
</html>
"""


def convert_row_to_html(row, users, tz_offset):
    IDX_DATE = 4
    IDX_ID = 3
    IDX_TEXT = 2
    if row[0] == 'message':
        IDX_DATE = 3
        IDX_ID = 2
        IDX_TEXT = 1
    html = '<div class="message">\n'
    try:
        ts_datetime = datetime.utcfromtimestamp(float(row[IDX_DATE]))
        utc_time = ts_datetime - timedelta(seconds=tz_offset)
        eastern_offset = timedelta(hours=-5)
        eastern_ts_datetime = utc_time + eastern_offset
        
        ts_iso = eastern_ts_datetime.isoformat()
    except:
        ts_iso = row[IDX_DATE]
    id = row[IDX_ID]
    try:
        (name, avatar) = (users[id]['name'], users[id]
                          ['avatar']) if users[id] else (id, '')
    except:
        (name, avatar) = (id, '')

    if avatar:
        html += f'<span><img class="avatar" src="{avatar}" alt="{name}" /></span>'
    html += f"<strong>{name}</strong> ({ts_iso})(GMT-5): {row[IDX_TEXT]}<br>\n"
    if row[0] == 'message':
        if row[8] == 'jpg' or row[8] == 'png' or row[8] == 'tif' or row[8] == 'tiff':  # case of image
            html += f'<img src="{row[5]}__{ts_iso.replace("T", " ").replace(":","-")}" alt="{row[5]}__{ts_iso.replace("T", " ").replace(":","-")}"><br>\n'
        else:
            html += f'<a href="{row[5]}__{ts_iso.replace("T", " ").replace(":","-")}" target="_blank">{row[5]}</a>\n'
    html += '</div>\n'
    return html

# with open('chats.csv', 'r', encoding='utf-8') as file:
#     reader = csv.reader(file)
#     header = next(reader)

#     messages_html = ""
#     for line_number, row in enumerate(reader, start=2):
#         try:
#             messages_html += convert_row_to_html(row)
#         except Exception as e:
#             print(f"Unexpected error on line {line_number}: {e} -> {row}")

# full_html = html_start + messages_html + html_end
# with open('chat_visualization.html', 'w', encoding='utf-8') as file:
#     file.write(full_html)


def main(csv_filename, users_csv, html_filename):
    users = {}
    tz_offset = 0
    with open(users_csv, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        for line_number, row in enumerate(reader, start=2):
            try:
                if row[32] == '1':
                    tz_offset = int(row[8])
                users[row[0]] = {'name': row[2], 'avatar': row[27], 'tz_offset': row[8], 'is_admin':row[32]}
            except Exception as e:
                print(f"Unexpected error on line {line_number}: {e} -> {row}")

    messages_html = ""
    with open(csv_filename, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        total_rows = sum(1 for row in reader)
        file.seek(0)  # Reset file pointer to the start of the file
        reader = csv.reader(file)  # Reset CSV reader

        for line_number, row in enumerate(reader, start=2):
            try:
                messages_html += convert_row_to_html(row, users, tz_offset)
                print(f"Processed row {line_number}/{total_rows}", end='\r')
            except Exception as e:
                print(f"\nUnexpected error on line {line_number}: {e} -> {row}")

    print(f"\nProcessed all rows. Saving HTML file...")  # Move to a new line after the last progress message
    full_html = html_start + messages_html + html_end
    if messages_html != "":
        with open(html_filename, 'w', encoding='utf-8') as file:
            file.write(full_html)
        print(f"Successfully generated {html_filename}.")
    else:
        print(f"Error occurred while generating.")



if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert a chat CSV file to a visualized HTML.")
    parser.add_argument("chats_csv", nargs='?', default="chats.csv",
                        help="The name of the CSV file containing the chat data.")
    parser.add_argument("users_csv", nargs='?', default="users.csv",
                        help="The name of the CSV file containing the user data.")
    parser.add_argument("html_filename", nargs='?', default="chat_visualization.html",
                        help="The name of the HTML file to output.")

    args = parser.parse_args()
    print(f"Converting to html...")
    main(args.chats_csv, args.users_csv, args.html_filename)
