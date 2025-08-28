import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useServiceNotifications } from "@/hooks/useServiceNotifications";
import { 
  MessageSquare, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Wifi,
  Send
} from "lucide-react";

export const WAHATestPanel = () => {
  const [testPhone, setTestPhone] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  
  const { toast } = useToast();
  const { sendTestNotification, testWAHAConnection } = useServiceNotifications();

  const isWAHAConfigured = () => {
    const apiKey = import.meta.env.VITE_WAHA_API_KEY;
    const url = import.meta.env.VITE_WAHA_URL;
    return url && apiKey && apiKey !== 'your_waha_api_key' && apiKey !== '';
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    
    try {
      const result = await testWAHAConnection();
      setLastTestResult(result);
      setConnectionStatus(result.success ? "connected" : "disconnected");
      
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      setConnectionStatus("disconnected");
      setLastTestResult({ success: false, message: "Connection test failed", error });
      toast({
        title: "Connection Test Failed",
        description: "An error occurred while testing the connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to send test message",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);
    
    try {
      const result = await sendTestNotification(testPhone);
      
      toast({
        title: result.success ? "Test Message Sent" : "Failed to Send",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Send Test Failed",
        description: "An error occurred while sending test message",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case "disconnected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Wifi className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            WAHA WhatsApp Integration
          </h3>
          <p className="text-sm text-muted-foreground">
            Test and monitor WhatsApp notifications for service requests
          </p>
        </div>

        {/* Connection Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Connection Status</Label>
            {getConnectionBadge()}
          </div>
          
          <Button 
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            variant="outline"
            className="w-full"
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
        </div>

        {/* Test Message */}
        <div className="space-y-3">
          <Label htmlFor="test-phone">Send Test Message</Label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                id="test-phone"
                placeholder="08123456789"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: 08xxxxxxxxx (Indonesian phone number)
              </p>
            </div>
            <Button 
              onClick={handleSendTestMessage}
              disabled={isSendingTest || !testPhone.trim()}
            >
              {isSendingTest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium flex items-center">
            Configuration Status
            {!isWAHAConfigured() && (
              <Badge variant="destructive" className="ml-2">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">WAHA URL:</span>
              <span className="font-mono">{import.meta.env.VITE_WAHA_URL || 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session:</span>
              <span className="font-mono">{import.meta.env.VITE_WAHA_SESSION || 'default'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">API Key:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono">
                  {!import.meta.env.VITE_WAHA_API_KEY || import.meta.env.VITE_WAHA_API_KEY === 'your_waha_api_key' ? (
                    <Badge variant="destructive">Not configured</Badge>
                  ) : (
                    <Badge variant="default">••••••••</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>
          {!isWAHAConfigured() && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="text-yellow-800 font-medium">⚠️ Configuration Required</p>
              <p className="text-yellow-700 mt-1">
                Please set a valid WAHA API key in your .env file:
                <br />
                <code className="bg-yellow-100 px-1 rounded">VITE_WAHA_API_KEY="your_actual_api_key"</code>
              </p>
            </div>
          )}
        </div>

        {/* Test Results */}
        {lastTestResult && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Last Test Result</h4>
            <div className="text-sm">
              <div className="flex items-center space-x-2 mb-2">
                {lastTestResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={lastTestResult.success ? "text-green-600" : "text-red-600"}>
                  {lastTestResult.message}
                </span>
              </div>
              {lastTestResult.details && (
                <div className="bg-muted p-2 rounded font-mono text-xs overflow-auto max-h-32">
                  <pre>{JSON.stringify(lastTestResult.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-3">
          <h4 className="font-medium">Automatic Notifications</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span>New request confirmation</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span>Status update notifications</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span>Document ready alerts</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span>Operator notes delivery</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};