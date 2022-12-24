const fs = require('fs/promises');
const path = require('path');
const tempPath = path.join(utools.getPath('temp'), '2fa.error.txt');
try {
  var sqlite3 = require('sqlite3').verbose();
  var Q = require('q');
  const {utils, dateUtils} = require('@stacker/alfred-utils');
  const lookBackMinutes = 10;

  (async function () {
    const messages = await readLatestMessage();
    iMdisconnect();
    let items = [];
    if (messages.length) {
      items.push(...messages.reduce((res, messageObj) => {
        const msg = preProcessMessage(messageObj.text);
        if (!msg.trim()) {
          return res;
        }
        const captcha = readCaptchaFromMessage(msg);
        if (captcha) {
          const subject = readSubjectFromMessage(msg);
          res.push(utils.buildItem({
            title: `${captcha}`,
            subtitle: `${subject ? `Sender：${subject} ` : ''}${dateUtils.formatToCalendar(messageObj.message_date)}，⏎ to Copy`,
            arg: captcha,
            text: {
              largetype: messageObj.text, copy: captcha
            }
          }));
        }
        return res;
      }, []))
    }
    if (items.length) {
      return utils.printScriptFilter({
        items
      });
    } else {
      utils.printScriptFilter({
        items: [utils.buildItem({
          title: 'There is no authentication code', subtitle: '⏎ to view Messages App', arg: 'view_message'
        })]
      });
    }
  })();


  function preProcessMessage(msg) {
    return msg.replace(/((https?|ftp|file):\/\/|www\.)[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/i, '');
  }

  /**
   * 读取短信验证码
   * @param msg
   * @returns {null|*}
   */
  function readCaptchaFromMessage(msg) {
    try {
      return msg.match(/\d{4,6}/)[0];
    } catch (e) {
      return null;
    }
  }

  /**
   * 读取短信主题
   * @param msg
   * @returns {null|*}
   */
  function readSubjectFromMessage(msg) {
    try {
      return msg.match(/【.+】/)[0];
    } catch {
      return null;
    }
  }

  function readLatestMessage() {
    return new Promise((resolve) => {
      iMgetDb(function (err, db) {
        db.all(`
            select
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
                    >= datetime('now', '-${lookBackMinutes} minutes', 'localtime')
        order by
            message.date desc
        limit 50`, function (err, res) {
          resolve(res);
        });
      });
    });
  }

  window.exports = {
    'smsVerificationCode': {
      mode: 'list',
      args: {
        enter: (action, callbackSetList) => {
          readLatestMessage().then((message) => {
            if (message && message.length > 0) {
              let messageList = [];
              for (let i = 0; i < message.length; i++) {
                var code = readCaptchaFromMessage(message[i].text);
                messageList.push({
                  title: readSubjectFromMessage(message[i].text),
                  description: message[i].text,
                  code: code,
                })
              }
              callbackSetList(messageList)
            } else {
              callbackSetList([
                {
                  title: "未读取到验证码",
                  description: '可能还没有收到验证码',
                  code: ''
                }
              ])
            }
          })
        },
        // 用户选择列表中某个条目时被调用
        select: (action, itemData, callbackSetList) => {
          let modifier = utools.isMacOS() ? 'command' : 'ctrl';
          utools.hideMainWindow()
          let code = itemData.code
          if (code !== '') {
            utools.copyText(code)
            utools.simulateKeyboardTap('v', modifier)
          }
          utools.outPlugin()
        }
      }
    },
  }


  function iMconnect() {
    var deferred = Q.defer();
    var db = new sqlite3.Database(
      path.join(process.env["HOME"], '/Library/Messages/chat.db'),
      sqlite3.OPEN_READONLY,
      function (err, res) {
        if (err) {
          console.log("数据库连接失败", err)
          return deferred.reject(err)
        }

        return deferred.resolve(db);
      });

    return deferred.promise;
  }

  function iMgetDb(cb) {
    var args = arguments;

    // nodeify?
    iMconnect().then(function (db) {
      cb(null, db);
    }, function (err) {
      cb(err);
    });
  }

  window.iMgetRecipients = function (string, cb) {
    if (typeof string == 'function') {
      cb = string;
      string = false;
    }
    iMconnect().done(function (db) {
      var where = "";
      // Maybe dangerous, check SQLlite doc
      if (string && string != "") where = " WHERE id LIKE '%" + string + "%'";
      db.all("SELECT * FROM `handle`" + where, cb);
    });
  };

  window.iMgetRecipientById = function (id, details, cb) {
    if (typeof details == 'function') {
      cb = details;
      details = false;
    }
    iMconnect().done(function (db) {
      db.get("SELECT * FROM `handle` WHERE ROWID = $id", {$id: id}, function (err, recipient) {
        if (!details) return cb(err, recipient);
        if (err) return cb(err);
        db.all("SELECT * FROM `message` WHERE handle_id = $id", {$id: id}, function (err, messages) {
          if (err) return cb(err);
          recipient.messages = messages;
          cb(err, recipient);
        });
      });
    });
  };

  window.iMgetMessages = function (string, details, cb) {
    if (typeof string == 'function') {
      cb = string;
      string = false;
    }
    if (typeof details == 'function') {
      cb = details;
      details = false;
    }

    iMconnect().done(function (db) {
      var where = "";
      var join = "";
      // Maybe dangerous, check SQLlite doc
      if (string && string != "") where = " WHERE `message`.text LIKE '%" + string + "%'";
      if (details) join = " JOIN `handle` ON `handle`.ROWID = `message`.handle_id";
      db.all("SELECT * FROM `message`" + join + where, cb);
    });
  };

  window.iMgetMessagesFromId = function (id, string, cb) {
    if (typeof string == 'function') {
      cb = string;
      string = false;
    }

    iMconnect().done(function (db) {
      var where = "";
      // Maybe dangerous, check SQLlite doc
      if (string && string != "") where = " AND text LIKE '%" + string + "%'";
      db.all("SELECT * FROM `message` WHERE handle_id = $id" + where, {$id: id}, function (err, messages) {
        cb(err, messages);
      });
    });
  };

  window.iMgetAttachmentsFromId = function (id, cb) {
    iMconnect().done(function (db) {
      db.all("SELECT * FROM `message` \
      INNER JOIN `message_attachment_join` \
      ON `message`.ROWID = `message_attachment_join`.message_id \
      INNER JOIN `attachment` \
      ON `attachment`.ROWID = `message_attachment_join`.attachment_id \
      WHERE `message`.handle_id = $id", {$id: id}, function (err, messages) {
        cb(err, messages);
      });
    });
  };

  window.iMgetAttachmentById = function (id, cb) {
    iMconnect().done(function (db) {
      db.get("SELECT * FROM `message` \
      INNER JOIN `message_attachment_join` \
      ON `message`.ROWID = `message_attachment_join`.message_id \
      INNER JOIN `attachment` \
      ON `attachment`.ROWID = `message_attachment_join`.attachment_id \
      WHERE `message_attachment_join`.attachment_id = $id", {$id: id}, function (err, messages) {
        cb(err, messages);
      });
    });
  };

  window.iMgetAttachments = function (cb) {
    iMconnect().done(function (db) {
      db.all("SELECT * FROM `message_attachment_join` \
      INNER JOIN `message` \
      ON `message`.ROWID = `message_attachment_join`.message_id \
      INNER JOIN `attachment` \
      ON `attachment`.ROWID = `message_attachment_join`.attachment_id", cb);
    });
  };

  window.iMdisconnect = function () {
    iMconnect().done(function (db) {
      db.close();
    });
  };
} catch (e) {
  // fs写入文件
  fs.writeFile(tempPath, "插件运行出错,请将以下错误信息发送给作者处理:\n\n" + e.toString());
  // 打开文件
  utools.shellOpenPath(tempPath)
}
