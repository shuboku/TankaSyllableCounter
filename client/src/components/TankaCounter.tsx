import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TankaCounter: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [result, setResult] = useState<string[]>([]);
  const [charCount, setCharCount] = useState<number>(0);
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

  // Constants
  const TANKA_PATTERN = [5, 7, 5, 7, 7];
  const EXPECTED_TOTAL = TANKA_PATTERN.reduce((a, b) => a + b, 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update character count when input changes
  useEffect(() => {
    setCharCount(input.length);
  }, [input]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle counting and displaying syllables
  const countSyllables = () => {
    const trimmedInput = input.trim();
    
    // Reset display states
    setShowResult(false);
    setShowError(false);
    
    // Validate input
    if (!trimmedInput) {
      return;
    }
    
    // Check if input roughly matches expected total
    if (Math.abs(trimmedInput.length - EXPECTED_TOTAL) > 5) {
      setErrorMessage(`入力された文字数(${trimmedInput.length})が短歌の標準的な音数(${EXPECTED_TOTAL})と大きく異なります。`);
      setShowError(true);
      return;
    }
    
    // Process and display the tanka
    const outputLines: string[] = [];
    const newMoraStatus = [...moraStatus];
    let pointer = 0;
    
    for (let i = 0; i < TANKA_PATTERN.length; i++) {
      const len = TANKA_PATTERN[i];
      const phrase = trimmedInput.slice(pointer, pointer + len);
      outputLines.push(phrase + "／");
      
      // Check if this segment has the correct number of characters
      if (phrase.length === len) {
        newMoraStatus[i] = "success";
      } else {
        newMoraStatus[i] = "warning";
      }
      
      pointer += len;
    }
    
    setMoraStatus(newMoraStatus);
    setResult(outputLines);
    setShowResult(true);
  };

  // Handle clear button
  const clearInput = () => {
    setInput("");
    setResult([]);
    setShowResult(false);
    setShowError(false);
    setMoraStatus(["default", "default", "default", "default", "default"]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle Enter key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      countSyllables();
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
            ひらがなで入力してください。自動的に 5-7-5-7-7 の形式に分割されます。
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
              placeholder="ひらがなで短歌を入力してください..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-jp text-gray-800 resize-none h-32"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            <div className={`absolute bottom-2 right-2 text-xs ${
              charCount === 0 
                ? "text-gray-500" 
                : charCount === EXPECTED_TOTAL 
                ? "text-success" 
                : "text-secondary"
            }`}>
              <span>{charCount}</span> 文字
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              onClick={countSyllables}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <i className="ri-text-spacing mr-1"></i> 音数をカウントして表示
            </Button>
            
            <Button
              variant="secondary"
              onClick={clearInput}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              <i className="ri-delete-bin-line"></i>
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
                <p className="font-jp text-sm">短歌を入力してボタンを押してください</p>
              </div>
            )}
            
            {showResult && (
              <div className="font-jp text-gray-800 whitespace-pre-wrap leading-relaxed">
                {result.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            )}
            
            {showError && (
              <div className="text-error font-jp text-sm">
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
