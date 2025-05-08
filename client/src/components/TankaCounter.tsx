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
  const [showExample, setShowExample] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [moraStatus, setMoraStatus] = useState<Array<"default" | "success" | "warning">>([
    "default",
    "default",
    "default",
    "default",
    "default",
  ]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Constants
  const TANKA_PATTERN = [5, 7, 5, 7, 7];
  const EXPECTED_TOTAL = TANKA_PATTERN.reduce((a, b) => a + b, 0);

  // Japanese special character handling
  // These characters count as part of the previous mora, not as separate mora
  const SMALL_KANA = /[ぁぃぅぇぉゃゅょゎっァィゥェォャュョヮッ]/;
  const LONG_VOWEL = /[ー]/;
  
  /**
   * Count Japanese mora (syllables) in text
   * Handles special cases like small kana and long vowels
   */
  const countMora = (text: string): number => {
    let count = 0;
    
    for (let i = 0; i < text.length; i++) {
      // Skip characters that are part of the previous mora
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
      
      // Count mora until we reach the target or end of text
      while (currentMora < targetMora && endPos < text.length) {
        // Move to next character
        endPos++;
        
        // Skip characters that are part of the previous mora
        if (endPos < text.length && 
            (SMALL_KANA.test(text[endPos]) || 
             LONG_VOWEL.test(text[endPos]))) {
          endPos++;
          continue;
        }
        
        currentMora++;
      }
      
      // Add the segment to results
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
      setShowResult(false);
      setShowError(false);
      setMoraStatus(["default", "default", "default", "default", "default"]);
      return;
    }
    
    // Count total mora
    const totalMora = countMora(input);
    setMoraCount(totalMora);
    
    // Reset error state
    setShowError(false);
    
    // Show warning if mora count is very different from expected
    if (Math.abs(totalMora - EXPECTED_TOTAL) > 5) {
      setErrorMessage(`入力された音の数(${totalMora})が短歌の標準的な音数(${EXPECTED_TOTAL})と大きく異なります。`);
      setShowError(true);
    }
    
    // Split text by mora pattern and add formatting
    const lines = splitByMora(input, TANKA_PATTERN);
    
    // Format for display
    const formattedLines = lines.map(line => line ? line + "／" : "／");
    setDisplayedLines(formattedLines);
    
    // Update status indicators
    const newStatus = lines.map((line, i) => {
      const expectedMora = TANKA_PATTERN[i];
      const actualMora = countMora(line);
      
      if (actualMora === 0) return "default";
      if (actualMora === expectedMora) return "success";
      return "warning";
    });
    
    setMoraStatus(newStatus);
    setShowResult(true);
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
    setShowResult(false);
    setShowError(false);
    setMoraStatus(["default", "default", "default", "default", "default"]);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Toggle example visibility
  const toggleExample = () => {
    setShowExample(!showExample);
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
            <div className={`absolute bottom-2 right-2 text-xs ${
              moraCount === 0 
                ? "text-gray-500" 
                : moraCount === EXPECTED_TOTAL 
                ? "text-success" 
                : "text-secondary"
            }`}>
              <span>{moraCount}</span> 音
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
              <div className="font-jp text-gray-800 whitespace-pre-wrap leading-relaxed">
                {displayedLines.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
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
      <CardFooter className="px-6 py-4 bg-gray-100 text-center text-xs text-gray-500">
        <p className="w-full">© 2023 短歌音数カウンター</p>
      </CardFooter>
    </Card>
  );
};

export default TankaCounter;