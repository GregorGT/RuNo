
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import "./vars.css"

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

async  function template_message_box_call() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
     // setGreetMsg(await invoke("greet", { "name1" }));
      await invoke("template_message_box_call", { });
  }

  return (
      <div className="container">

          <div className="app-filter">
              <div className="content">
                  <div className="tabs">
                      <div className="lite-filter-lite-filter">
                          <div className="pill-button-wrapper">
                              <div className="positioning-wrapper">
                                  <div className="pill-button-pill-button">
                                      <div className="base">
                                          <div className="text">Filter</div>
                                      </div>
                                  </div>
                                  <div className="pill-button-pill-button2">
                                      <div className="base2">
                                          <div className="text2">Sorting</div>
                                      </div>
                                  </div>
                                  <div className="pill-button-pill-button2">
                                      <div className="base2">
                                          <div className="text2">Value</div>
                                      </div>
                                  </div>
                                  <div className="pill-button-pill-button2">
                                      <div className="base2">
                                          <div className="text2">Header</div>
                                      </div>
                                  </div>

                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="content2">
                      <div className="text3">
                          <div className="text4">Formula scope:</div>
                          <div className="text4">Global [X]</div>
                          <div className="text4">Filtered [ ]</div>
                      </div>
                      <div className="content3">
                          <div className="filter-block">
                              <div className="content4">
                                  <div className="combo-box-combo-box">
                                      <div className="base3">
                                          <div className="text-wrapper">
                                              <div className="text5">Or</div>
                                              <div className="min-width"></div>
                                          </div>
                                          <div className="chevron-down-med">
                                              <div className="chevron-down-med2"></div>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="content5">
                                      <div className="row">
                                          <div className="text6">
                                              <div className="text7">Date modified =&gt; 07/11/2023</div>
                                          </div>
                                          <div className="radio-button-radio-button">
                                              <div className="base4"></div>
                                              <div className="bullet"></div>
                                          </div>
                                      </div>
                                      <div className="row">
                                          <div className="text6">
                                              <div className="text7">Date modified =&gt; 09/11/2023</div>
                                          </div>
                                          <div className="radio-button-radio-button">
                                              <div className="base5"></div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div className="hyperlink-button-hyperlink-button">
                                  <div className="base6">
                                      <div className="icon-wrapper">
                                          <div className="div">􀅼</div>
                                      </div>
                                      <div className="text-wrapper2">
                                          <div className="text8">Add filter</div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <div className="button-button">
                              <div className="min-width2"></div>
                              <div className="text">Add filter groups</div>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="left-pannel">
                  <div className="title">
                      <div className="title2">
                          <svg
                              className="checkbox-checkbox"
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                          >
                              <path
                                  d="M4 0.5C2.067 0.5 0.5 2.067 0.5 4V16C0.5 17.933 2.067 19.5 4 19.5H16C17.933 19.5 19.5 17.933 19.5 16V4C19.5 2.067 17.933 0.5 16 0.5H4Z"
                                  fill="black"
                                  fill-opacity="0.0241"
                                  stroke="#BABABA"
                              />
                          </svg>

                          <div className="text9">entries</div>
                      </div>
                      <div className="button-button">
                          <div className="min-width2"></div>
                          <div className="text">Add an entry</div>
                      </div>
                  </div>
                  <div className="content6">
                      <div onClick={(e) => {
                          //e.preventDefault();
                          template_message_box_call();
                      }}>
                          This is a test click.
                      </div>
                      <h1>
                          This is a test.
                      </h1>

                      <div>1</div>
                      <div>Testing it 1</div>
                      <br/>
                      <div>2</div>
                      <div className="Testing1">Testing it 2</div>
                      <br/>
                      <div>2</div>
                      <div className="Testing2">Testing it 2</div>
                      <br/>

                      <table>
                          <tr>
                              <th>Person 1</th>
                              <th>Person 2</th>
                              <th>Person 3</th>
                          </tr>
                          <tr>
                              <td>Emil</td>
                              <td>Tobias</td>
                              <td>Linus</td>
                          </tr>
                          <tr>
                              <td>16</td>
                              <td>14</td>
                              <td>10</td>
                          </tr>
                      </table>
                  </div>
              </div>
              <div className="header">
                  <div className="title-bar">
                      <div className="parts-title-bar-icon-title-group">
                          <div className="icon-and-title">
                          <div className="text-container">
                                  <div className="text11">OpenSource</div>
                              </div>
                          </div>
                      </div>
                      <div className="parts-title-bar-caption-control-group">
                          <div className="parts-title-bar-caption-control-button">
                              <div className="base24"></div>
                              <div className="icon"></div>
                          </div>
                          <div className="parts-title-bar-caption-control-button2">
                              <div className="base24"></div>
                              <div className="icon"></div>
                          </div>
                          <div className="parts-title-bar-caption-control-button3">
                              <div className="base25"></div>
                              <div className="chrome-close"></div>
                          </div>
                      </div>
                  </div>
                  <div className="file-menu-file-menu-example">
                      <div className="items">
                          <div className="file-menu-parts-file-menu-button">
                              <div className="base26">
                                  <div className="text12">File</div>
                              </div>
                          </div>
                          <div className="file-menu-parts-file-menu-button">
                              <div className="base26">
                                  <div className="text12">Edit</div>
                              </div>
                          </div>
                          <div className="file-menu-parts-file-menu-button">
                              <div className="base26">
                                  <div className="text12">Info</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>


          <h1>Welcome to Tauri!</h1>

          <div className="row">
              <a href="https://vitejs.dev" target="_blank">
                  <img src="/vite.svg" className="logo vite" alt="Vite logo"/>
              </a>
              <a href="https://vitejs.dev" target="_blank">
                  <img src="/vite.svg" className="logo vite" alt="Vite logo"/>
              </a>
              <a href="https://tauri.app" target="_blank">
                  <img src="/tauri.svg" className="logo tauri" alt="Tauri logo"/>
              </a>
              <a href="https://reactjs.org" target="_blank">
                  <img src={reactLogo} className="logo react" alt="React logo"/>
              </a>
          </div>

          <textarea> </textarea>
          <textarea> </textarea>


          <p>Click on the Tauri, Vite, and React logos to learn more.</p>


          <form
              className="row"
              onSubmit={(e) => {
                  e.preventDefault();
                  greet();
              }}
          >
              <input
                  id="greet-input"
                  onChange={(e) => setName(e.currentTarget.value)}
                  placeholder="Enter a name..."
              />
              <button type="submit">Greet</button>
          </form>

          <p>{greetMsg}</p>
      </div>
  );
}

export default App;
