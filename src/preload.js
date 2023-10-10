const {execFile, exec} = require('child_process');

const fs = require('fs');

const executablePath = `${process.env["HOME"]}/2fa`;

let currentCallbackSetList = null;

ERROR_MESSAGE_ENUMS = {
  'NOT_FOUND': {'message': '未找到依赖文件', 'description': '点击自动下载可依赖文件, 是否继续?', 'code': 'download'},
  'NO_PERMISSION': {'message': '获取验证码失败', 'description': '可能是因为没有权限! 依赖文件损坏! 依赖文件不兼容您当前的MacOS系统'},
  'NO_CODE': {'message': '未读取到验证码', 'description': '可能还没有收到验证码或者包含短信验证码的短信已经超过了10分钟!'},
  'LOADING': {'message': '正在读取短信验证码', 'description': '请您稍等片刻...'}
}

window.exports = {
  'smsVerificationCode': {
    mode: 'list',
    args: {
      enter: (action, callbackSetList) => {
        currentCallbackSetList = callbackSetList
        // 检查是否存在可执行文件
        if (!fs.existsSync(executablePath)) {
          setMessageList('NOT_FOUND')
          return;
        }
        setMessageList('LOADING')
        execFile(executablePath, (error, stdout, stderr) => {
          if (error) {
            console.error(error);
            setMessageList('NO_PERMISSION')
            return;
          }
          const message = JSON.parse(stdout);
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
            setMessageList('NO_CODE')
          }
        });
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
        if (code === 'download') {
          download_2fa()
          // utools.shellShowItemInFolder(process.env["HOME"] + '/')
        }
        utools.outPlugin()
      }
    }
  },
}

/**
 * 下载2fa可执行文件
 */
function download_2fa() {
  let url = 'http://wmfiles.oss-cn-beijing.aliyuncs.com/2fa'
  // 下载文件保存目录
  let savePath = process.env["HOME"]
  // 下载文件名
  let fileName = '2fa'
  // 下载文件
  let downloadFile = savePath + '/' + fileName
  // 下载文件
  exec(`curl -o ${downloadFile} ${url}`, (error, stdout, stderr) => {
    console.log(error, stdout, stderr)
    exec(`chmod 777 ${downloadFile}`, (error, stdout, stderr) => {
      console.log(error, stdout, stderr)
      utools.showNotification('依赖文件下载成功, 请重新打开插件')
    });
  });

}


/**
 * 设置消息列表
 * @param code
 */
function setMessageList(code) {
  const enums = ERROR_MESSAGE_ENUMS[code]
  currentCallbackSetList([
    {
      title: enums.message,
      description: enums.description,
      code: enums?.code || '',
    }
  ])
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
