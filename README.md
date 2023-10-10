# 2fa-read-message-code
> 读取最近短信验证码消息到剪切板, 用于后续的网页内容填写.

🚑 v1.0.2版本重大调整! 因不同芯片版本的sqlite3库不同,所以使用了Python来读取短信数据库, 代码见[python_code](https://github.com/RipperTs/2fa-read-message-code/tree/main/python_code)目录.  
插件首次使用会提示下载打包后的Python可执行文件, 下载完后即可正常使用.  
如果下载失败,可以手动下载[python_code](https://github.com/RipperTs/2fa-read-message-code/releases/download/v1.0.2/2fa)文件,并放到`~`目录下即可.     
```shell
# 快速打开 ~ 目录命令
open ~
# 然后给2fa文件执行权限
chmod +x 2fa
或者
chmod 777 2fa
```

📝 使用此方式可能会比原nodejs版本略慢一点, 但是可以保证兼容性, 请谅解.   

## 注意事项
本插件需要在iPhone手机上开启短信转发,并且在Mac的安全隐私设置中给uTools完全磁盘访问权限
    - 短信转发设置: 设置->信息->短信转发  (`允许通过其他已登录iMessage信息账户接收iPhone短信`)

## 使用
1. Type `2fa` to trigger uTools
2. Type`⌘ C` or `⏎` to copy captcha

## 效果

![img.png](public/img/Xnip2022-11-20_18-42-40.png)
![img_1.png](public/img/Xnip2022-11-20_18-42-55.png)

## 原理
Mac上短信数据库位置是放在 `Library/Messages/chat.db` 通过插件读取到并解析出来最近的短信验证码, 然后通过剪切板复制到剪切板

## 问题
- 如果有问题可以在[issues](https://github.com/RipperTs/2fa-read-message-code/issues)中提出,我会尽快解决
- 插件报错后会自动打开日志文件,可以在日志文件中查看错误信息

## 鸣谢
- 灵感来源: [squatto](https://github.com/squatto/alfred-imessage-2fa)
