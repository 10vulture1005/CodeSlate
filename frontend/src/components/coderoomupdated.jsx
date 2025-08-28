import { useEffect, useState, useRef } from "react";
import { useRoom, useMutation, useStorage } from "@liveblocks/react/suspense";

import "./App.css";
import CodeEditor from "./CodeEditor";
import axios from "axios";
import { encode as btoa } from "base-64"; 

import {
  Autocomplete,
  AutocompleteSection,
  AutocompleteItem,
} from "@heroui/react";

function safeBase64Encode(str) {
  return btoa(unescape(encodeURIComponent(sanitizeCodeComment(str))));
}

function sanitizeCodeComment(input) {
  return input
    .split('')                     
    .filter(char =>
      /[a-zA-Z0-9\s]/.test(char) || 
      /[(){}\[\]<>+=\-*/%&|!^~?:;.,_'"\\#]/.test(char) 
    )
    .join('');
}

function CodingRoom({mystream, remotestream}) {
  const [code, setCode] = useState('console.log("Hello, World!");');
  console.log("am i in");
  
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(105); 
  const [videosMinimized, setVideosMinimized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Video refs
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Liveblocks hooks for synchronized state
  const room = useRoom();
  
  // Get synchronized input and output from Liveblocks storage



  const input = useStorage((root) => root.input) || "";
  const output = useStorage((root) => root.output) || "";


  
  const runningState = useStorage((root) => root.isRunning) || false;

  // Mutations to update synchronized state
  const updateInput = useMutation(({ storage }, newInput) => {
    storage.set("input", newInput);
  }, []);

  const updateOutput = useMutation(({ storage }, newOutput) => {
    storage.set("output", newOutput);
  }, []);

  const updateRunningState = useMutation(({ storage }, running) => {
    storage.set("isRunning", running);
  }, []);

  // Initialize storage if not present
  useEffect(() => {
    if (room) {
      // Initialize storage with default values if they don't exist
      room.getStorage().then((storage) => {
        if (storage.get("input") === undefined) {
          storage.set("input", "");
        }
        if (storage.get("output") === undefined) {
          storage.set("output", "");
        }
        if (storage.get("isRunning") === undefined) {
          storage.set("isRunning", false);
        }
      });
    }
  }, [room]);

  // Update local running state when storage changes
  useEffect(() => {
    setIsRunning(runningState);
  }, [runningState]);

  // Set up video streams
  useEffect(() => {
    if (myVideoRef.current && mystream) {
      myVideoRef.current.srcObject = mystream;
    }
  }, [mystream]);

  useEffect(() => {
    if (remoteVideoRef.current && remotestream) {
      remoteVideoRef.current.srcObject = remotestream;
    }
  }, [remotestream]);

  const getDefaultCode = (languageId) => {
    const templates = {
      105: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // your code goes here

}
`, 
      91: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`, 
      102: `console.log("Hello, World!");`, 
      103: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`, 
      98: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`, 
      111: `fun main() {
    println("Hello, World!")
}
`, 
      107: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`, 
      51: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`, 
      46: 'echo "Hello, World!"',
      71:"print(\"hello world\")" 
    };
    
    return templates[languageId] || 'console.log("Hello, World!");';
  };

  useEffect(() => {
    async function getLanguageInfo() {
      const languageIds = [105, 91, 102, 103, 98, 111, 107, 51, 46, 71];
      const fetchedLanguages = [];

      for (const id of languageIds) {
        try {
          const res = await axios.get(`https://ce.judge0.com/languages/${id}`);
          fetchedLanguages.push(res.data);
        } catch (err) {
          console.error(`Failed to fetch language ID ${id}:`, err.message);
        }
      }

      setLanguages(fetchedLanguages);
    }

    getLanguageInfo();
  }, []);

  async function createSubmission() {
    const submissionData = {
      source_code: safeBase64Encode(code),
      language_id: selectedLanguage,
      stdin: safeBase64Encode(input),
    };
    console.log("Encoded Submission Data:", submissionData);

    const options = {
      method: "POST",
      url: "https://judge0-ce.p.rapidapi.com/submissions",
      params: {
        base64_encoded: "true", 
        wait: "false",
        fields: "*",
      },
      headers: {
        "x-rapidapi-key": "416dd9700fmshb895b4fced4b96ap108a86jsn6dea3f6d1734",
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      data: submissionData,
    };

    try {
      const response = await axios.request(options);
      if (response.data && response.data.token) {
        setTimeout(() => fetchResult(response.data.token), 2000);
      } else {
        updateOutput("Error: No token received from submission");
        updateRunningState(false);
      }
    } catch (error) {
      console.error("Submission Error:", error);
      updateOutput(`Submission Error: ${error.response?.data?.error || error.message}`);
      updateRunningState(false);
    }
  }

  async function fetchResult(token) {
    console.log("Fetching result for token:", token);
    
    const options = {
      method: "GET",
      url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
      params: {
        base64_encoded: "false",
        fields: "*",
      },
      headers: {
        "x-rapidapi-key": "416dd9700fmshb895b4fced4b96ap108a86jsn6dea3f6d1734",
        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      },
    };

    try {
      const response = await axios.request(options);
      console.log("Result Response:", response.data);
      
      if (response.data.status && response.data.status.id <= 2) {
        setTimeout(() => fetchResult(token), 1000);
        return;
      }

      let outputText = "";
      
      if (response.data.stdout) {
        outputText += response.data.stdout;
      }
      
      if (response.data.stderr) {
        outputText += (outputText ? "\n" : "") + "Error:\n" + response.data.stderr;
      }
      
      if (response.data.compile_output) {
        outputText += (outputText ? "\n" : "") + "Compile Output:\n" + response.data.compile_output;
      }
      
      if (response.data.status) {
        if (response.data.status.id === 3 && !outputText) {
          outputText = "Code executed successfully (no output)";
        } else if (response.data.status.id !== 3) {
          outputText = (outputText ? outputText + "\n" : "") + `Status: ${response.data.status.description}`;
        }
      }

      updateOutput(outputText || "No output received");
      updateRunningState(false);
    } catch (error) {
      console.error("Fetch Result Error:", error.response?.data || error.message);
      updateOutput(`Error fetching result: ${error.response?.data?.error || error.message}`);
      updateRunningState(false);
    }
  }

  const runCode = () => {
    updateRunningState(true);
    
    if (selectedLanguage === 102) {
      try {
        const originalLog = console.log;
        let capturedOutput = "";

        console.log = (...args) => {
          capturedOutput += args.join(" ") + "\n";
        };

        const prompt = (message) => {
          return input || "";
        };

        eval(code);
        console.log = originalLog;

        updateOutput(capturedOutput || "Code executed successfully (no output)");
        updateRunningState(false);
      } catch (error) {
        updateOutput(`Error: ${error.message}`);
        updateRunningState(false);
      }
    } else {
      updateOutput("Running code...");
      createSubmission();
    }
  };

  const clearOutput = () => {
    updateOutput("");
  };

  const handleInputChange = (e) => {
    updateInput(e.target.value);
  };

  const handleLanguageChange = (key) => {
    const newLanguageId = Number(key);
    setSelectedLanguage(newLanguageId);
    
    const defaultCode = getDefaultCode(newLanguageId);
    setCode(defaultCode);
  };

  const toggleVideos = () => {
    setVideosMinimized(!videosMinimized);
  };

  return (
    <>
      <div className="h-screen w-screen bg-[#171717] flex flex-row relative">
        {/* Video Streams Container */}
        <div className={`absolute top-4 right-4 z-10 transition-all duration-300 ${
          videosMinimized ? 'transform scale-75 opacity-80' : ''
        }`}>
          <div className="flex flex-col gap-2">
            {/* Toggle Button */}
            <button
              onClick={toggleVideos}
              className="self-end bg-[#2D2D2D] hover:bg-[#404040] text-white px-2 py-1 rounded text-xs transition-colors"
            >
              {videosMinimized ? '🔍' : '🔎'}
            </button>
            <button
              onClick={toggleVideos}
              className="self-end bg-[#2D2D2D] hover:bg-[#404040] text-white px-2 py-1 rounded text-xs transition-colors"
            >
              {videosMinimized ? 'back' : 'back'}
            </button>
            
            {/* Remote Video */}
            {remotestream && (
              <div className="relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  className={`rounded-lg border-2 border-[#404040] bg-black ${
                    videosMinimized ? 'w-32 h-24' : 'w-48 h-36'
                  }`}
                />
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  Remote
                </div>
              </div>
            )}
            
            {/* My Video */}
            {mystream && (
              <div className="relative">
                <video
                  ref={myVideoRef}
                  autoPlay
                  playsInline
                  muted={true}
                  className={`rounded-lg border-2 border-[#404040] bg-black ${
                    videosMinimized ? 'w-32 h-24' : 'w-48 h-36'
                  }`}
                />
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  You
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor Section */}
        <div className="h-screen w-1/2 p-10 bg-transparent pt-5">
          <div className="h-full pb-9 pl-9 pr-9 bg-[#1E1E1E] rounded-lg shadow-xl border-[#242424] border-2">
            <div className="pt-5 pb-5">
              <Autocomplete
                className="w-1/3 opacity-90"
                label="Select Language"
                selectedKey={selectedLanguage.toString()}
                onSelectionChange={handleLanguageChange}
                variant="bordered"
                color="primary"
                classNames={{
                  base: "text-white",
                  trigger: "bg-[#2D2D2D] border-[#404040]",
                  listbox: "bg-[#2D2D2D]",
                  popoverContent: "bg-[#2D2D2D] border-[#404040]"
                }}
              >
                {languages.map((language) => (
                  <AutocompleteItem 
                    key={language.id.toString()}
                    className="text-white data-[hover=true]:bg-[#404040]"
                  >
                    {language.name}
                  </AutocompleteItem>
                ))}
              </Autocomplete>
            </div>
            <CodeEditor
              code={code}
              setCode={setCode}
              lang={languages}
              langid={selectedLanguage}
            />
          </div>
        </div>

        {/* Input/Output Section */}
        <div className="h-screen w-1/2 p-10 pb-14 bg-transparent">
          {/* Input Section */}
          <div className="h-1/2 p-5 bg-[#1E1E1E] mb-5 rounded-lg shadow-xl border-[#242424] border-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-lg font-semibold">
                Input
                {isRunning && (
                  <span className="ml-2 text-yellow-400 text-sm animate-pulse">
                    • Running...
                  </span>
                )}
              </h2>
              <button
                onClick={runCode}
                disabled={isRunning}
                className={`${
                  isRunning 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white px-4 py-2 rounded-md transition-colors`}
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
            </div>
            <textarea
              value={input}
              onChange={handleInputChange}
              disabled={isRunning}
              placeholder="Enter your input here (for programs that read from stdin)..."
              className={`w-full h-[calc(100%-60px)] bg-[#2D2D2D] text-white p-3 rounded border border-[#404040] resize-none focus:outline-none ${
                isRunning 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'focus:border-green-500'
              }`}
            />
          </div>

          {/* Output Section */}
          <div className="h-1/2 p-5 bg-[#1E1E1E] rounded-lg shadow-xl border-[#242424] border-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-lg font-semibold">
                Output
                {isRunning && (
                  <span className="ml-2 text-yellow-400 text-sm animate-pulse">
                    • Processing...
                  </span>
                )}
              </h2>
              <button
                onClick={clearOutput}
                disabled={isRunning}
                className={`${
                  isRunning 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white px-4 py-2 rounded-md transition-colors`}
              >
                Clear
              </button>
            </div>
            <div className="w-full h-[calc(100%-60px)] bg-[#2D2D2D] text-green-400 p-3 rounded border border-[#404040] overflow-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {output || "Output will appear here..."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CodingRoom;