import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TankaCounter: React.FC = () => {
  const [userInput, setUserInput] = useState<string>("");
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [moraCount, setMoraCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0); // Separate state for display
  const [showExample, setShowExample] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [kanjiVersion, setKanjiVersion] = useState<string>("");
  const [showKanjiEditor, setShowKanjiEditor] = useState<boolean>(false);
  const [savedTanka, setSavedTanka] = useState<string[]>([]);
  const [moraStatus, setMoraStatus] = useState<Array<"default" | "success" | "warning">>([
    "default",
    "default",
    "default",
    "default",
    "default",
  ]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const kanjiEditorRef = useRef<HTMLTextAreaElement>(null);

  // Constants
  const TANKA_PATTERN = [5, 7, 5, 7, 7];
  const EXPECTED_TOTAL = TANKA_PATTERN.reduce((a, b) => a + b, 0);

  // Japanese special character handling
  // These characters count as part of the previous mora, not as separate mora
  const SMALL_KANA = /[ぁぃぅぇぉゃゅょゎっァィゥェォャュョヮッ]/;
  const LONG_VOWEL = /[ー]/;
  // Characters to completely exclude from mora counting
  const EXCLUDED_CHARS = /[「」""''（）\s]/;
  
  /**
   * Count Japanese mora (syllables) in text
   * Handles special cases like small kana and long vowels
   * Excludes characters like quotes, parentheses and spaces
   */
  const countMora = (text: string): number => {
    let count = 0;
    
    for (let i = 0; i < text.length; i++) {
      // Skip excluded characters like quotes, parentheses and spaces
      if (EXCLUDED_CHARS.test(text[i])) {
        continue;
      }
      
      // Check if the next character forms a mora unit with this one
      if (i + 1 < text.length && 
          (SMALL_KANA.test(text[i+1]) || LONG_VOWEL.test(text[i+1]))) {
        count++;
        i++; // Skip the next character as we've counted it as part of this mora
        continue;
      }
      
      // Skip characters that are part of the previous mora (should rarely happen with the check above)
      if (i > 0 && 
          (SMALL_KANA.test(text[i]) || 
           (LONG_VOWEL.test(text[i])))) {
        continue;
      }
      
      count++;
    }
    
    return count;
  };
  
  /**
   * Split text into groups based on mora count
   * Ensures we don't split in the middle of a mora unit
   * Properly handles excluded characters
   */
  const splitByMora = (text: string, pattern: number[]): string[] => {
    const result: string[] = [];
    let currentPos = 0;
    
    for (const targetMora of pattern) {
      if (currentPos >= text.length) {
        result.push("");
        continue;
      }
      
      let currentMora = 0;
      let endPos = currentPos;
      let inExcludedSection = false;
      let excludedText = "";
      
      // Count mora until we reach the target or end of text
      while (currentMora < targetMora && endPos < text.length) {
        const currentChar = text[endPos];
        
        // Keep track of excluded characters in the segment
        if (EXCLUDED_CHARS.test(currentChar)) {
          inExcludedSection = true;
          excludedText += currentChar;
          endPos++;
          continue;
        }
        
        // Check for small kana or long vowel
        if (endPos + 1 < text.length) {
          const nextChar = text[endPos + 1];
          if (SMALL_KANA.test(nextChar) || LONG_VOWEL.test(nextChar)) {
            // Move position after this complete mora unit
            endPos += 2;
            currentMora++;
            continue;
          }
        }
        
        // Regular character (counts as one mora)
        endPos++;
        currentMora++;
      }
      
      // Add the segment to results, preserving excluded characters
      result.push(text.substring(currentPos, endPos));
      currentPos = endPos;
    }
    
    // Add any remaining text as a final segment
    if (currentPos < text.length) {
      result.push(text.substring(currentPos));
    }
    
    return result;
  };
  
  // Process and format input for display
  const processInput = (input: string) => {
    if (!input || input.trim() === "") {
      setDisplayedLines([]);
      setMoraCount(0);
      setDisplayCount(0);
      setShowResult(false);
      setShowError(false);
      setMoraStatus(["default", "default", "default", "default", "default"]);
      setKanjiVersion(""); // Reset kanji version when input is cleared
      setShowKanjiEditor(false);
      return;
    }
    
    // Always set showResult to true when there's input
    setShowResult(true);
    
    try {
      // Get proper count immediately to ensure it's always shown
      let countedMora = 0;
      
      try {
        // Try to get precise mora count
        countedMora = countMora(input);
      } catch (err) {
        // Fallback to character count if mora counting fails
        countedMora = input.replace(EXCLUDED_CHARS, '').length;
      }
      
      // Always update both counts - one for calculations, one for display
      setMoraCount(countedMora);
      setDisplayCount(countedMora);
      
      // Reset error state
      setShowError(false);
      
      // Show warning if mora count is very different from expected
      if (Math.abs(countedMora - EXPECTED_TOTAL) > 5) {
        setErrorMessage(`入力された音の数(${countedMora})が短歌の標準的な音数(${EXPECTED_TOTAL})と大きく異なります。`);
        setShowError(true);
      }
      
      try {
        // Split text by mora pattern and add formatting
        const lines = splitByMora(input, TANKA_PATTERN);
        
        // Format for display
        const formattedLines = lines.map(line => line ? line + "／" : "／");
        setDisplayedLines(formattedLines);
        
        // Update status indicators
        const newStatus = lines.map((line, i) => {
          const expectedMora = TANKA_PATTERN[i];
          let actualMora = 0;
          
          try {
            actualMora = countMora(line);
          } catch (err) {
            actualMora = line.replace(EXCLUDED_CHARS, '').length;
          }
          
          if (actualMora === 0) return "default";
          if (actualMora === expectedMora) return "success";
          return "warning";
        });
        
        setMoraStatus(newStatus);
      } catch (innerError) {
        console.error("Error processing line divisions:", innerError);
        // Even if splitting fails, we still show the mora count
      }
    } catch (error) {
      console.error("Error processing input:", error);
      // Even if there's an error, ensure the mora count is displayed
      try {
        const fallbackCount = input.replace(EXCLUDED_CHARS, '').length;
        setMoraCount(fallbackCount);
        setDisplayCount(fallbackCount);
      } catch (e) {
        // Ultimate fallback - just count raw characters
        setMoraCount(input.length);
        setDisplayCount(input.length);
      }
    }
  };
  
  // Handle text input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInput = e.target.value;
    setUserInput(newInput);
    processInput(newInput);
  };
  
  // Handle clear button
  const clearInput = () => {
    setUserInput("");
    setDisplayedLines([]);
    setMoraCount(0);
    setDisplayCount(0);
    setShowResult(false);
    setShowError(false);
    setShowKanjiEditor(false);
    setKanjiVersion("");
    setMoraStatus(["default", "default", "default", "default", "default"]);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Toggle example visibility
  const toggleExample = () => {
    setShowExample(!showExample);
  };
  
  // Show kanji editor with current tanka
  const showKanjiConversionEditor = () => {
    if (userInput.trim() === "") return;
    
    // Start with the original input as the kanji version
    setKanjiVersion(userInput);
    setShowKanjiEditor(true);
  };
  
  // Handle changes in the kanji editor
  const handleKanjiChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKanjiVersion(e.target.value);
  };
  
  // Save tanka to saved list
  const saveTanka = () => {
    if (kanjiVersion.trim() === "") return;
    
    // Create a new array with the saved tanka
    setSavedTanka([...savedTanka, kanjiVersion]);
    
    // Show confirmation and reset the editor
    setShowKanjiEditor(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-primary px-6 py-4 text-white">
        <h1 className="text-2xl font-bold font-jp">短歌音数カウンター</h1>
        <p className="text-sm opacity-90 mt-1">Tanka Syllable Counter</p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Instructions */}
        <section className="mb-6">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-medium text-gray-800 font-jp">入力方法</h2>
            <Button 
              variant="ghost" 
              onClick={toggleExample} 
              className="text-primary text-sm flex items-center h-8 px-2"
            >
              <i className="ri-information-line mr-1"></i> 
              <span>{showExample ? "例を隠す" : "例を表示"}</span>
            </Button>
          </div>
          
          <p className="text-gray-600 mt-2 font-jp text-sm">
            ひらがなで入力してください。自動的に 5-7-5-7-7 の音数で分析されます。
          </p>

          {/* Example Section */}
          {showExample && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2 font-jp">例:</h3>
              <p className="font-jp text-gray-600 text-sm">たんぽぽのわたげがとんだはるのそらまいあがるようにこどものこえ</p>
              <div className="mt-2 font-jp text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                <p>たんぽぽの／</p>
                <p>わたげがとんだ／</p>
                <p>はるのそら／</p>
                <p>まいあがるように／</p>
                <p>こどものこえ／</p>
              </div>
            </div>
          )}
        </section>

        {/* Input Area */}
        <section className="mb-6">
          <label htmlFor="tankaInput" className="block text-sm font-medium text-gray-700 mb-2 font-jp">
            短歌を入力
          </label>
          <div className="relative">
            <Textarea
              id="tankaInput"
              ref={textareaRef}
              value={userInput}
              placeholder="ひらがなで短歌を入力してください..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-jp text-gray-800 resize-none h-32"
              onChange={handleInputChange}
            />
            <div className="absolute bottom-2 right-2 text-sm font-bold bg-white/90 px-2 py-1 rounded shadow-sm border border-gray-200">
              <span className={`${
                displayCount === 0 
                  ? "text-gray-700" 
                  : displayCount === EXPECTED_TOTAL 
                  ? "text-success" 
                  : "text-primary"
              }`}>
                {displayCount} 音
              </span>
              {displayCount > 0 && displayCount !== EXPECTED_TOTAL && 
                <span className="text-gray-500 ml-1 text-xs">(標準: {EXPECTED_TOTAL}音)</span>
              }
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={clearInput}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <i className="ri-delete-bin-line mr-1"></i> 入力をクリア
            </Button>
          </div>
        </section>

        {/* Results Area */}
        <section>
          <h2 className="text-lg font-medium text-gray-800 mb-2 font-jp">結果</h2>
          <div className="min-h-[180px] p-4 bg-gray-50 rounded-lg border border-gray-200">
            {!showResult && !showError && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <i className="ri-file-text-line text-3xl mb-2"></i>
                <p className="font-jp text-sm">短歌を入力すると、自動的に分割されます</p>
              </div>
            )}
            
            {showResult && (
              <div className="font-jp text-gray-800 leading-relaxed">
                <div className="flex flex-wrap">
                  {displayedLines.map((line, index) => (
                    <span key={index} className="inline-block">{line}</span>
                  ))}
                </div>
                
                {!showKanjiEditor && (
                  <div className="mt-4">
                    <Button
                      onClick={showKanjiConversionEditor}
                      className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      <i className="ri-translate-2 mr-1"></i> 漢字に変換して保存
                    </Button>
                  </div>
                )}
                
                {showKanjiEditor && (
                  <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 font-jp">漢字に変換</h3>
                    <Textarea
                      ref={kanjiEditorRef}
                      value={kanjiVersion}
                      placeholder="漢字を含めた最終版を入力してください..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-jp text-gray-800 resize-none h-24 mb-3"
                      onChange={handleKanjiChange}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setShowKanjiEditor(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={saveTanka}
                        className="bg-success hover:bg-success/90 text-white"
                      >
                        <i className="ri-save-line mr-1"></i> 保存
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {showError && (
              <div className="text-error font-jp text-sm mb-2">
                {errorMessage}
              </div>
            )}
          </div>

          {showResult && (
            <div className="mt-4 text-xs text-gray-500 flex font-jp">
              <div className="flex flex-wrap gap-2">
                {TANKA_PATTERN.map((count, index) => (
                  <Badge 
                    key={index}
                    variant={
                      moraStatus[index] === "success" 
                        ? "outline" 
                        : moraStatus[index] === "warning" 
                        ? "secondary" 
                        : "default"
                    }
                    className={`px-2 py-1 rounded ${
                      moraStatus[index] === "success" 
                        ? "bg-success/10 text-success border-success/20" 
                        : moraStatus[index] === "warning" 
                        ? "bg-secondary/10 text-secondary border-secondary/20" 
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}
                  >
                    {count}音
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      </CardContent>

      {/* Footer */}
      {/* Saved Tanka Section */}
      {savedTanka.length > 0 && (
        <CardContent className="px-6 pt-0 pb-6">
          <section>
            <h2 className="text-lg font-medium text-gray-800 mb-2 font-jp">保存された短歌</h2>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              {savedTanka.map((tanka, index) => (
                <div 
                  key={index} 
                  className="mb-3 pb-3 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0 font-jp"
                >
                  {tanka}
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      )}
      
      <CardFooter className="px-6 py-4 bg-gray-100 text-center text-xs text-gray-500">
        <p className="w-full">© 2023 短歌音数カウンター</p>
      </CardFooter>
    </Card>
  );
};

export default TankaCounter;