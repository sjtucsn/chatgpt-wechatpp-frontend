// index.ts
// 获取应用实例
const app = getApp<IAppOption>()

Page({
  data: {
    chatContentList: [{
      id: 'CHATGPT_0',
      isUser: false,
      content: 'I am ChatGPT, how can I help you?'
    }],
    inputValue: '',
    lastViewId: 'CHATGPT_0',
    keyboardHeight: 0,
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'), // 如需尝试获取用户信息可改为false
    buttonDisable: false // 按钮是否在disable状态
  },
  bindConfirm(e: any) {
    let content = e.detail.value;
    this.sendChatMessage(content);
  },
  bindButtonTap() {
    this.sendChatMessage(this.data.inputValue);
  },
  bindInput(e: any) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  bindFocus(e: any) {
    if (e.detail.height) {
      this.setData({
        keyboardHeight: e.detail.height
      })
    }
  },
  bindBlur() {
    this.setData({
      keyboardHeight: 0
    })
  },
  sendChatMessage(content: string) {
    if (!content) {
      wx.showToast({
        title: '请先输入',
        icon: 'error',
        duration: 1000
      })
      return;
    }
    let id = "CHATGPT_" + new Date().getTime();
    let chatContent = {
      id,
      isUser: true,
      content
    };
    let chatContentList = [...this.data.chatContentList, chatContent];
    this.setData({
      chatContentList,
      buttonDisable: true,
      lastViewId: id,
      inputValue: ''
    })

    // 画画分支
    if (content.startsWith("画") || content.startsWith("draw") || content.startsWith("paint")) {
      wx.request({
        url: 'http://192.168.1.5:8080/chat/image/generation',
        data: {
          prompt: content
        },
        method: 'POST',
        success: (res: any) => {
          console.log(res);
          let chatContent;
          let id = "CHATGPT_" + new Date().getTime();
          if (res.data.success) {
            let url = res.data.url;
            chatContent = {
              id,
              isUser: false,
              content: "image",
              url
            };
          } else {
            chatContent = {
              id,
              isUser: false,
              content: 'system error, please waiting',
            };
          }
  
          let chatContentList = [...this.data.chatContentList, chatContent];
  
          this.setData({
            chatContentList,
            buttonDisable: false,
            lastViewId: id
          })
        }
      })
      return;
    }

    wx.request({
      url: 'http://192.168.1.5:8080/chat/completion',
      data: {
        content: chatContentList.filter(chatContent => chatContent.content != "image").map(chatContent => {
          if (chatContent.isUser) {
            return "Human: " + chatContent.content
          } else {
            return "AI: " + chatContent.content
          }
        }).join("\n")
      },
      method: 'POST',
      success: (res: any) => {
        console.log(res);
        let chatContent;
        let id = "CHATGPT_" + new Date().getTime();
        if (res.data.success) {
          let responseText = res.data.responseText;
          chatContent = {
            id,
            isUser: false,
            content: responseText.indexOf("AI: ") != -1 ? responseText.substring(responseText.indexOf("AI: ") + 4, responseText.length) : responseText,
          };
        } else {
          chatContent = {
            id,
            isUser: false,
            content: 'system error, please waiting',
          };
        }

        let chatContentList = [...this.data.chatContentList, chatContent];

        this.setData({
          chatContentList,
          buttonDisable: false,
          lastViewId: id
        })
      }
    })
  },
  // 事件处理函数
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs',
    })
  },
  onLoad() {
    // @ts-ignore
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },
  getUserProfile() {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  getUserInfo(e: any) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
