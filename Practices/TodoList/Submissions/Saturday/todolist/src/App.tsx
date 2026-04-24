import {useState} from "react";

export default function App() {
  const [items,setItems] = useState([]);
  const [text,setText] = useState("");
  return (
    <div>
      <h3>todo list</h3>
      <input value={text}
        onChange={e => setText(e.target.value)}/>
      <button onClick={() => {
        if (!text) return;
        setItems([...items, text]);
        setText("");}}>
        add
      </button>
      <button onClick={() => {
        const file = new Blob([items.join("\n")]);
        const a=document.createElement("a");
        a.href=URL.createObjectURL(file);
        a.download="meow.txt";
        a.click();}}>
        save
      </button>
      <ul>
        {items.map((item,i) => (
          <li key={i}>
            {item}
            <button onClick={() => setItems(items.filter((_, j) => j !== i))}>
              ow
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};