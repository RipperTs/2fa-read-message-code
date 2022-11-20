/**
 * 验证码短信模版
 */
const {readCaptchaFromMessage, readLatestMessage, readSubjectFromMessage, preProcessMessage} = require("./index");
// const code1 = readCaptchaFromMessage('您的验证码是：2498，有效期为10分钟，请尽快验证！The verification code is 2498. It is valid for 10 minutes.');
// console.log(code1);
//
// const code2 = readCaptchaFromMessage('【Google】G-495968 是您的 Google 驗證碼。');
// console.log(code2);
//
// const code3 = readCaptchaFromMessage('尊敬的客户，验证码：133706，您正在进行登录账户，有效期2分钟。买健康险，就上平安健康APP！【平安健康险】');
// console.log(code3);
//
// const code4 = readCaptchaFromMessage(preProcessMessage('尊敬的用户，您可以直接回复指令进行业务查询或办理：\n' +
//     ' 00：手机上网流量查询\n' +
//     ' 01：账户余额\n' +
//     ' 02：实时话费\n' +
//     ' 03：常用办理业务\n' +
//     ' 04：常用查询业务\n' +
//     ' 05：充值卡充值\n' +
//     ' 【抗击疫情，服务不停！使用中国联通APP，足不出户交话费、查余额、办业务，免流量看电影、玩游戏，点击 http://u.10010.cn/khddx ，马上拥有】'));
//
// console.log(code4);
//
// const code5 = readCaptchaFromMessage('【BOSS直聘】登录验证码：780929，30分钟内有效。工作人员不会向您索要验证码，切勿将验证码提供给他人，谨防被骗。');
// console.log(code5);
//
// const subject = readCaptchaFromMessage('【阿里云盘】验证码：176863。此验证码只用于进行短信登录，15分钟内有效');
// console.log("验证码",subject);
readLatestMessage().then((message) => {
    console.log(message)
})
// console.log("读短信", readLatestMessage())
