"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useRoom } from "@liveblocks/react/suspense";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { Cursors } from "./Cursors";

export default function CodeEditor({ lang, langid, code, setCode }) {
  const [editorRef, setEditorRef] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [currentLangId, setCurrentLangId] = useState(null);
  
  // Refs for managing state and preventing race conditions
  const bindingRef = useRef(null);
  const isBindingActiveRef = useRef(false);
  const suppressOnChangeRef = useRef(false);
  const lastSyncedContentRef = useRef("");
  const debounceTimerRef = useRef(null);
  const updateQueueRef = useRef([]);
  const isDisposedRef = useRef(false);
  const yProviderRef = useRef(null);
  
  const room = useRoom();

  // Initialize yProvider with error handling
  useEffect(() => {
    try {
      const provider = getYjsProviderForRoom(room);
      yProviderRef.current = provider;
    } catch (error) {
      console.error("Error initializing Yjs provider:", error);
    }

    return () => {
      yProviderRef.current = null;
    };
  }, [room]);

  const languageMap = {
    102: { monaco: "javascript", name: "JavaScript" },
    91: { monaco: "java", name: "Java" },
    105: { monaco: "c", name: "C" },
    103: { monaco: "cpp", name: "C++" },
    98: { monaco: "cpp", name: "C++" },
    111: { monaco: "plaintext", name: "Plain Text" },
    107: { monaco: "plaintext", name: "Plain Text" },
    51: { monaco: "csharp", name: "C#" },
    46: { monaco: "shell", name: "Bash" },
    71: { monaco: "python", name: "Python" },
    62: { monaco: "java", name: "Java" },
    54: { monaco: "cpp", name: "C++" },
  };

  const getDefaultCode = (languageId) => {
    const templates = {
      102: `console.log("Hello, World!");`,
      91: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
      105: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
      103: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      98: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      51: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
      46: `echo "Hello, World!"`,
      71: `print("Hello, World!")`,
      62: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
      54: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
    };
    return templates[languageId] || "";
  };

  // Safe editor model access
  const getEditorModel = useCallback(() => {
    try {
      if (!editorRef || isDisposedRef.current) return null;
      const model = editorRef.getModel();
      if (!model || model.isDisposed()) return null;
      return model;
    } catch (error) {
      console.warn("Error accessing editor model:", error);
      return null;
    }
  }, [editorRef]);

  // Chunked update function with size limits
  const applyChunkedUpdate = useCallback((yText, content, maxChunkSize = 500) => {
    if (!yText || typeof content !== 'string') return;

    try {
      // Clear existing content efficiently
      const currentLength = yText.length;
      if (currentLength > 0) {
        yText.delete(0, currentLength);
      }

      // Insert content in smaller chunks to avoid WebSocket limits
      if (content.length > maxChunkSize) {
        // Use transaction to batch operations
        yText.doc?.transact(() => {
          for (let i = 0; i < content.length; i += maxChunkSize) {
            const chunk = content.slice(i, i + maxChunkSize);
            yText.insert(i, chunk);
          }
        });
      } else {
        yText.insert(0, content);
      }
    } catch (error) {
      console.error("Error applying chunked update:", error);
    }
  }, []);

  // Enhanced cleanup function
  const cleanupBinding = useCallback(() => {
    if (bindingRef.current) {
      try {
        // Remove Y.js observers first
        if (bindingRef.current._yText && bindingRef.current._yTextObserver) {
          bindingRef.current._yText.unobserve(bindingRef.current._yTextObserver);
        }
        
        // Destroy the binding
        bindingRef.current.destroy();
      } catch (error) {
        console.warn("Error during binding cleanup:", error);
      }
      
      bindingRef.current = null;
    }
    
    isBindingActiveRef.current = false;
  }, []);

  // Process queued updates with size management
  const processUpdateQueue = useCallback(() => {
    if (updateQueueRef.current.length === 0 || !editorRef || isDisposedRef.current) return;

    try {
      const updates = [...updateQueueRef.current];
      updateQueueRef.current = [];

      // Get the latest update
      const latestUpdate = updates[updates.length - 1];
      
      if (latestUpdate !== lastSyncedContentRef.current) {
        suppressOnChangeRef.current = true;
        
        // Truncate very large content to prevent WebSocket issues
        const maxContentSize = 10000; // 10KB limit
        const truncatedContent = latestUpdate.length > maxContentSize 
          ? latestUpdate.slice(0, maxContentSize) 
          : latestUpdate;
        
        setCode(truncatedContent);
        lastSyncedContentRef.current = truncatedContent;
        
        setTimeout(() => {
          suppressOnChangeRef.current = false;
        }, 100);
      }
    } catch (error) {
      console.error("Error processing update queue:", error);
    }
  }, [editorRef, setCode]);

  // Setup Yjs binding with improved error handling
  const setupBinding = useCallback(() => {
    if (!editorRef || !yProviderRef.current || isDisposedRef.current) return;

    cleanupBinding();

    try {
      const yDoc = yProviderRef.current.getYDoc();
      const yText = yDoc.getText("monaco");
      const model = getEditorModel();
      
      if (!model) return;
      
      // Initialize with current code if Yjs document is empty
      if (yText.length === 0 && code) {
        applyChunkedUpdate(yText, code);
      }

      const binding = new MonacoBinding(
        yText,
        model,
        new Set([editorRef]),
        yProviderRef.current.awareness
      );

      bindingRef.current = binding;
      isBindingActiveRef.current = true;

      // Handle content changes with improved error handling
      const handleContentChange = () => {
        try {
          if (!isBindingActiveRef.current || isDisposedRef.current) return;
          
          const currentModel = getEditorModel();
          if (!currentModel) return;
          
          const currentContent = currentModel.getValue();
          
          // Limit content size to prevent WebSocket issues
          if (currentContent.length > 15000) {
            console.warn("Content too large, truncating...");
            return;
          }
          
          updateQueueRef.current.push(currentContent);
          
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          debounceTimerRef.current = setTimeout(() => {
            processUpdateQueue();
          }, 200);
        } catch (error) {
          console.error("Error in handleContentChange:", error);
        }
      };

      // Y.js change observer
      const yTextObserver = () => {
        if (isBindingActiveRef.current && !isDisposedRef.current) {
          handleContentChange();
        }
      };

      yText.observe(yTextObserver);
      
      // Store references for cleanup
      binding._yText = yText;
      binding._yTextObserver = yTextObserver;

    } catch (error) {
      console.error("Error setting up Monaco binding:", error);
      isBindingActiveRef.current = false;
    }
  }, [editorRef, code, cleanupBinding, applyChunkedUpdate, processUpdateQueue, getEditorModel]);

  // Enhanced cleanup
  const enhancedCleanup = useCallback(() => {
    isDisposedRef.current = true;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    updateQueueRef.current = [];
    cleanupBinding();
  }, [cleanupBinding]);

  // Handle editor mount with disposal tracking
  const handleOnMount = useCallback((editor) => {
    isDisposedRef.current = false;
    setEditorRef(editor);
    
    editor.updateOptions({
      quickSuggestions: { other: true, comments: false, strings: false },
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: true,
      renderLineHighlight: "line",
      renderWhitespace: "selection",
      smoothScrolling: true,
      wordBasedSuggestions: false,
      // Additional options to handle large documents
      maxTokenizationLineLength: 1000,
      renderValidationDecorations: "off",
    });

    // Track model disposal
    const model = editor.getModel();
    if (model) {
      const originalDispose = model.dispose.bind(model);
      model.dispose = () => {
        isDisposedRef.current = true;
        enhancedCleanup();
        originalDispose();
      };
    }
  }, [enhancedCleanup]);

  // Set up binding when editor is ready
  useEffect(() => {
    if (editorRef && yProviderRef.current && !isDisposedRef.current) {
      const timer = setTimeout(setupBinding, 300);
      return () => clearTimeout(timer);
    }
  }, [editorRef, setupBinding]);

  // Handle language changes
  useEffect(() => {
    if (lang && Array.isArray(lang) && langid) {
      const selectedLang = lang.find((l) => l.id === langid);

      if (selectedLang) {
        const monacoLang = languageMap[langid]?.monaco || "javascript";
        setLanguage(monacoLang);

        if (currentLangId !== langid) {
          const newDefaultCode = getDefaultCode(langid);
          const isCurrentCodeDefault = currentLangId
            ? code === getDefaultCode(currentLangId)
            : false;
          const isCodeEmpty = !code || code.trim() === "";

          if (isCodeEmpty || isCurrentCodeDefault) {
            const wasActive = isBindingActiveRef.current;
            if (wasActive) {
              enhancedCleanup();
              isDisposedRef.current = false; // Reset disposal flag
            }
            
            setCode(newDefaultCode);
            lastSyncedContentRef.current = newDefaultCode;
            
            if (wasActive && editorRef) {
              setTimeout(setupBinding, 500);
            }
          }

          setCurrentLangId(langid);
        }
      }
    }
  }, [lang, langid, code, currentLangId, enhancedCleanup, setupBinding, setCode, editorRef]);

  // Handle editor changes with size limits
  const handleEditorChange = useCallback((value) => {
    if (suppressOnChangeRef.current || isDisposedRef.current) return;

    const newValue = value || "";
    
    // Prevent extremely large updates
    if (newValue.length > 20000) {
      console.warn("Content too large, update rejected");
      return;
    }
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (newValue !== lastSyncedContentRef.current && !isDisposedRef.current) {
        lastSyncedContentRef.current = newValue;
        setCode(newValue);
      }
    }, 300);
  }, [setCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      enhancedCleanup();
    };
  }, [enhancedCleanup]);

  return (
    <div style={{ height: "90%", width: "100%" }}>
      {/* Only render cursors when provider is ready and not disposed */}
      {yProviderRef.current && !isDisposedRef.current && (
        <Cursors yProvider={yProviderRef.current} />
      )}
      
      <Editor
        height="90%"
        width="100%"
        theme="vs-dark"
        language={language}
        value={code}
        onMount={handleOnMount}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          folding: true,
          lineNumbersMinChars: 3,
          glyphMargin: false,
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: "advanced",
          bracketPairColorization: { enabled: true },
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          wordBasedSuggestions: false,
          parameterHints: { enabled: true },
          renderLineHighlight: "line",
          renderWhitespace: "selection",
          smoothScrolling: true,
          quickSuggestions: { other: true, comments: false, strings: false },
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: true,
          // Performance optimizations
          maxTokenizationLineLength: 1000,
          renderValidationDecorations: "off",
        }}
      />
    </div>
  );
}