import { useState, useEffect, useRef } from "react";
import {
  Send,
  Menu,
  XCircle,
  Paperclip,
  Search
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";

import {
  getTicketRooms,
  getRoomMessages,
  updateTicketStatus,
  sendTicketMessage
} from "../../api/frenchise/franchiseTicketApi";

const STATUS_OPTIONS = ["OPEN","IN_PROGRESS","RESOLVED","CLOSED"];

const getStatusColor = (status) => {

  const map = {
    OPEN:"bg-amber-100 text-amber-700",
    IN_PROGRESS:"bg-purple-100 text-purple-700",
    RESOLVED:"bg-green-100 text-green-700",
    CLOSED:"bg-gray-200 text-gray-700"
  };

  return map[status] || "bg-gray-100";

};

const ZoneTickets = () => {

const { isDark } = useTheme();

const [chats,setChats] = useState([]);
const [activeChatId,setActiveChatId] = useState(null);
const [input,setInput] = useState("");
const [search,setSearch] = useState("");
const [showSidebar,setShowSidebar] = useState(false);

const [loadingRooms,setLoadingRooms] = useState(true);
const [loadingMessages,setLoadingMessages] = useState(false);

const fileRef = useRef();
const messageEndRef = useRef();

const activeChat = chats.find(c=>c.id===activeChatId);

/* ===============================
LOAD ROOMS
=============================== */

useEffect(()=>{

 loadRooms();

},[]);

const loadRooms = async () => {

try{

const res = await getTicketRooms(1,20);

const rooms = res.data.map(room=>({

id:room._id,
name:`${room.customer.firstName} ${room.customer.lastName}`,
customerId:room.customer.userName,
status:room.status,
lastMsg:room.lastMessage || "",
time:room.lastMessageAt || "",
messages:[]

}));

setChats(rooms);

if(rooms.length){

setActiveChatId(rooms[0].id);
loadMessages(rooms[0].id);

}

}catch(err){

console.error(err);

}
finally{

setLoadingRooms(false);

}

};

/* ===============================
LOAD MESSAGES
=============================== */

const loadMessages = async (roomId)=>{

try{

setLoadingMessages(true);

const res = await getRoomMessages(roomId);

const messages = res.data.map(m=>({

id:m._id,
sender:m.senderRole==="CUSTOMER"?"customer":"agent",
text:m.message,
file:m.fileUrl,
type:m.messageType,
time:new Date(m.createdAt).toLocaleTimeString()

}));

setChats(prev=>prev.map(c=>

c.id===roomId
?{...c,messages}
:c

));

}catch(err){

console.error(err);

}
finally{

setLoadingMessages(false);

}

};

/* ===============================
AUTO SCROLL
=============================== */

useEffect(()=>{

messageEndRef.current?.scrollIntoView({behavior:"smooth"});

},[activeChat?.messages]);

/* ===============================
SELECT CHAT
=============================== */

const handleChatSelect=(id)=>{

setActiveChatId(id);
setShowSidebar(false);
loadMessages(id);

};

/* ===============================
SEND MESSAGE
=============================== */

const handleSend = async () => {

if(!input.trim()) return;

try{

await sendTicketMessage({
roomId:activeChatId,
message:input,
messageType:"TEXT"
});

setChats(prev=>prev.map(c=>

c.id===activeChatId
?{...c,
messages:[
...c.messages,
{id:Date.now(),sender:"agent",text:input,type:"TEXT",time:"Now"}
],
lastMsg:input
}
:c

));

setInput("");

}catch(err){

console.error(err);

}

};

/* ===============================
FILE UPLOAD
=============================== */

const handleFileUpload = async (e)=>{

const file=e.target.files[0];

if(!file) return;

const formData = new FormData();

formData.append("roomId",activeChatId);
formData.append("file",file);

try{

await sendTicketMessage(formData);
loadMessages(activeChatId);

}catch(err){

console.error(err);

}

};

/* ===============================
STATUS CHANGE
=============================== */

const handleStatusChange = async (status)=>{

try{

await updateTicketStatus(activeChatId,status);

setChats(prev=>prev.map(c=>

c.id===activeChatId
?{...c,status}
:c

));

}catch(err){

console.error(err);

}

};

const filteredChats = chats.filter(chat =>
chat.name.toLowerCase().includes(search.toLowerCase())
);

return(

<div className={`flex h-[calc(100vh-120px)] rounded-xl border overflow-hidden ${isDark?"bg-slate-900 border-slate-800":"bg-white border-gray-200"}`}>

{/* SIDEBAR */}

<div className={`w-80 border-r flex flex-col transition ${showSidebar?"translate-x-0":"-translate-x-full md:translate-x-0"} ${isDark?"border-slate-800 bg-slate-900":"border-gray-200 bg-white"}`}>

{/* HEADER */}

<div className="p-4 border-b">

<h2 className="font-bold text-lg mb-3">Support Tickets</h2>

<div className="relative">

<Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>

<input
value={search}
onChange={(e)=>setSearch(e.target.value)}
placeholder="Search tickets"
className="pl-9 pr-3 py-2 w-full rounded border text-sm"
/>

</div>

</div>

{/* LIST */}

<div className="flex-1 overflow-y-auto">

{loadingRooms ?

<div className="p-4 space-y-3 animate-pulse">

{[...Array(6)].map((_,i)=>(
<div key={i} className="h-12 bg-gray-200 rounded"/>
))}

</div>

:

filteredChats.map(chat=>(

<div
key={chat.id}
onClick={()=>handleChatSelect(chat.id)}
className={`p-4 border-b cursor-pointer transition ${activeChatId===chat.id?"bg-orange-500/10 border-l-2 border-orange-500":""}`}
>

<div className="flex justify-between">

<span className="font-medium text-sm">{chat.name}</span>

<span className={`text-[10px] px-2 py-1 rounded ${getStatusColor(chat.status)}`}>
{chat.status}
</span>

</div>

<p className="text-xs text-gray-500 truncate">{chat.lastMsg}</p>

</div>

))

}

</div>

</div>

{/* CHAT AREA */}

<div className="flex-1 flex flex-col">

{activeChat ?

<>

{/* CHAT HEADER */}

<div className="p-4 border-b flex justify-between items-center">

<div>

<h3 className="font-semibold">{activeChat.name}</h3>
<p className="text-xs text-gray-500">Customer ID: {activeChat.customerId}</p>

</div>

<select
value={activeChat.status}
onChange={(e)=>handleStatusChange(e.target.value)}
className="text-xs border rounded px-2 py-1"
>

{STATUS_OPTIONS.map(s=>(
<option key={s}>{s}</option>
))}

</select>

</div>

{/* MESSAGES */}

<div className="flex-1 p-4 overflow-y-auto space-y-3">

{loadingMessages ?

<div className="animate-pulse space-y-3">
{[...Array(6)].map((_,i)=>(
<div key={i} className="h-8 bg-gray-200 rounded"/>
))}
</div>

:

activeChat.messages.map(msg=>(

<div key={msg.id} className={`flex ${msg.sender==="agent"?"justify-end":"justify-start"}`}>

<div className={`max-w-xs p-3 rounded-lg text-sm shadow ${msg.sender==="agent"?"bg-orange-600 text-white":"bg-gray-200"}`}>

{msg.type==="IMAGE" && <img src={msg.file} className="rounded mb-2 max-w-[200px]"/>}

{msg.type==="FILE" && (
<a href={msg.file} target="_blank" className="underline block mb-1">
Download file
</a>
)}

{msg.text}

<div className="text-[10px] mt-1 opacity-70">
{msg.time}
</div>

</div>

</div>

))

}

<div ref={messageEndRef}></div>

</div>

{/* MESSAGE INPUT */}

{activeChat.status!=="CLOSED" && (

<div className="p-4 border-t flex gap-2 items-center">

<input
value={input}
onChange={(e)=>setInput(e.target.value)}
onKeyDown={(e)=>e.key==="Enter" && handleSend()}
className="flex-1 border rounded p-2 text-sm"
placeholder="Type message..."
/>

<input
type="file"
ref={fileRef}
onChange={handleFileUpload}
className="hidden"
/>

<button
onClick={()=>fileRef.current.click()}
className="p-2 border rounded"
>
<Paperclip size={16}/>
</button>

<button
onClick={handleSend}
className="p-2 bg-orange-600 rounded text-white"
>
<Send size={16}/>
</button>

</div>

)}

</>

:

<div className="flex items-center justify-center flex-1 text-gray-400">
Select a ticket to start chatting
</div>

}

</div>

</div>

);

};

export default ZoneTickets;