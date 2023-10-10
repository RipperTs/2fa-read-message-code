import sqlite3
import logging
import os
import json

lookBackMinutes = 10

sql = f"""select
            message.rowid,
            ifnull(handle.uncanonicalized_id, chat.chat_identifier) AS sender,
            message.service,
            datetime(message.date / 1000000000 + 978307200, 'unixepoch', 'localtime') AS message_date,
            message.text
        from
            message
                left join chat_message_join
                        on chat_message_join.message_id = message.ROWID
                left join chat
                        on chat.ROWID = chat_message_join.chat_id
                left join handle
                        on message.handle_id = handle.ROWID
        where
            message.is_from_me = 0
            and message.text is not null
            and length(message.text) > 0
            and (
                message.text glob '*[0-9][0-9][0-9][0-9]*'
                or message.text glob '*[0-9][0-9][0-9][0-9][0-9]*'
                or message.text glob '*[0-9][0-9][0-9][0-9][0-9][0-9]*'
                or message.text glob '*[0-9][0-9][0-9]-[0-9][0-9][0-9]*'
                or message.text glob '*[0-9][0-9][0-9][0-9][0-9][0-9][0-9]*'
                or message.text glob '*[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]*'
            )
            
            and datetime(message.date / 1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime')
                    >= datetime('now', '-{lookBackMinutes} minutes', 'localtime')
        order by
            message.date desc
        limit 10
"""


def get_code_message():
    conn = sqlite3.connect(f'{os.path.expanduser("~")}/Library/Messages/chat.db')
    try:
        cursor = conn.cursor()
        # 执行SQL查询
        cursor.execute(sql)
        columns = [description[0] for description in cursor.description]
        results = cursor.fetchall()
        # 打印带有字段名和值的查询结果
        messages = []
        for row in results:
            row_data = dict(zip(columns, row))
            messages.append(row_data)
        return messages
    except Exception as e:
        logging.error(f"get_code_message出错: {e}")
        return []
    finally:
        conn.close()


if __name__ == '__main__':
    result = get_code_message()
    # 将结果转换为json格式
    result = json.dumps(result, ensure_ascii=False)
    print(result)