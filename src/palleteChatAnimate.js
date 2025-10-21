var palleteChatAnimate = function(url_repository,id){
    this.chatInterval = null,
    this.isChatRunning = false;
    this.currentMessageIndex = 0;
    this.messageQueue = [];
    this.chatMessages = document.getElementById(id);
    this.urlRepository = url_repository ? url_repository : null;
    this.urlChat = null;
    this.repositoryData = null;
    this.repositoryVersion = null;
    this.chatData = [];
    this.cache = {};
    this.maxMsgShow = 3;
    this.isReadyCallback = ()=>{};
    this.__constructor = ()=>{
        this.resetChat();    
        this.fetchData(()=>{
            this.isReadyCallback();
            document.addEventListener('visibilitychange', () => {if (document.visibilityState === 'visible')this.solveOverflow()});
        })
    };
    this.saveCacheOnLocal = ()=>{
        localStorage.setItem('palleteChatAnimateCache', JSON.stringify(this.cache));
        localStorage.setItem('palleteChatAnimateCacheVersion', this.repositoryVersion);
    };
    this.fetchCacheOnLocal = ()=>{
        if(!this.repositoryVersion)return false;
        var cache = localStorage.getItem('palleteChatAnimateCache');
        var cacheVersion = localStorage.getItem('palleteChatAnimateCacheVersion');
        if(!cache || !cacheVersion)return false;
        if(cacheVersion != this.repositoryVersion)return false;
        this.cache = JSON.parse(localStorage.getItem('palleteChatAnimateCache'));
    };
    this.fetchData = (callback)=>{
        if(this.repositoryData){
            this.urlChat = this.repositoryData[parseInt(Math.random()*this.repositoryData.length)];
            if(this.cache[this.urlChat]){
                this.chatData = this.cache[this.urlChat];
                callback(); 
                return;
            }
            this.LoadJSON(this.urlChat,(err,data)=>{
                if(err){console.error(err);return;}
                this.chatData = data;
                this.cache[this.urlChat] = data;
                this.saveCacheOnLocal();
                callback();
            });
            return;
        }
        this.LoadJSON(this.urlRepository,(err,data)=>{
            if(err){console.error(err);return;}
            this.repositoryData = data.url;
            this.repositoryVersion = data.version;
            this.fetchCacheOnLocal();
            this.fetchData(callback);
        });
    }
    this.isReady = (callback)=>{this.isReadyCallback = callback};
    this.LoadJSON = (url,callback)=>{
        fetch(url)
            .then(response => response.ok ? response.json() : false)
            .then(data => callback(null,data))
            .catch(error => callback(error));
    };
    // Function to format time
    this.getCurrentTime= ()=>{
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    };
    // Function to create message element
    this.createMessageElement= (content, sender)=>{
        const containerDiv = document.createElement('div');
        containerDiv.className = `message-container ${sender} ${this.chatData[sender].className}`;
        const effectcontroller = document.createElement('div');
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.style.backgroundImage = `url('${this.chatData[sender].avatar}')`;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message`;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;     
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = `${this.getCurrentTime()} - ${this.chatData[sender].fullname}`;   
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);  
        effectcontroller.appendChild(avatarDiv);
        effectcontroller.appendChild(messageDiv);   
        containerDiv.appendChild(effectcontroller);   
        return containerDiv;
    };
    // Function to create a type marker
    this.createTypingIndicator= ()=>{
        const senderType = this.chatData.messages[this.currentMessageIndex].sender;
        const typingDiv = document.createElement('div');
        typingDiv.className = `typing-indicator-${senderType} ${this.chatData[senderType].className}`;
        typingDiv.id = 'typingIndicator';      
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDiv.appendChild(dot);
        }
        return typingDiv;
    };
    // Function to display the next message
    this.showNextMessage= (delay = null)=>{
        if (this.currentMessageIndex >= this.chatData.messages.length) {
            clearTimeout(this.chatInterval);
            this.isChatRunning = false;
            setTimeout(()=>this.replay(),500);
            return;
        }
        const message = this.chatData.messages[this.currentMessageIndex];
        // If there is already a type marker, delete it.
        const existingTyping = document.getElementById('typingIndicator');
        if (existingTyping) {
            existingTyping.remove();
        }
        // If the number of messages exceeds max show message, delete the oldest one.
        // if (this.chatMessages.children.length >= this.maxMsgShow) {
            // const firstMessage = this.chatMessages.children[0];
            // firstMessage.style.setProperty('--start-height', firstMessage.scrollHeight + 'px');
            // firstMessage.classList.add('message-removed');
            // firstMessage.addEventListener('animationend', () => {
            //     firstMessage.remove();
            // }, { once: true });
        // }
        // Show typing indicator
        const typingIndicator = this.createTypingIndicator();
        this.chatMessages.appendChild(typingIndicator);
        // Display the message after a delay.
        setTimeout(() => {
            typingIndicator.remove();
            
            const messageElement = this.createMessageElement(message.content, message.sender);
            this.chatMessages.appendChild(messageElement);
            if (this.chatMessages.children.length >= this.maxMsgShow){
                const firstMessage = this.chatMessages.children[0];
                firstMessage.style.setProperty('--start-height', firstMessage.scrollHeight + 'px');
                firstMessage.classList.add('message-removed');
                firstMessage.addEventListener('animationend', () => {
                    firstMessage.remove();
                }, { once: true });
            }
            // Scroll down
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            
            this.currentMessageIndex++;
            this.chatInterval = setTimeout(this.showNextMessage.bind(this), 1000);
        }, delay || message.delay || 4000);
    };
    // Chat start function
    this.startChat = ()=>{
        if (this.isChatRunning) {
            clearTimeout(this.chatInterval);
            this.isChatRunning = false;
            return;
        }
        // If the chat is over, start over.
        if (this.currentMessageIndex >= this.chatData.messages.length) {
            this.resetChat();
        }
        this.isChatRunning = true;
        // Show first message
        this.showNextMessage(1);
        // Set the interval for displaying subsequent messages.
        // this.chatInterval = setTimeout(this.showNextMessage.bind(this), 4000);
    };
    // Chat reset function
    this.resetChat= ()=>{
        clearTimeout(this.chatInterval);
        this.isChatRunning = false;
        this.currentMessageIndex = 0;
        this.chatMessages.innerHTML = '';
    }
    this.replay= ()=>{
        this.fetchData(()=>{
            this.resetChat();
            this.isReadyCallback();
        })
    }
    this.solveOverflow = ()=>{
        if (this.chatMessages.children.length <= this.maxMsgShow)return;
        var remove_length = this.chatMessages.children.length-this.maxMsgShow;
        var i = -1;
        while(++i < remove_length)this.chatMessages.children[i].remove();
    };

    this.__constructor();
}