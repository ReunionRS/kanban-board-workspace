import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Chrome, MessageCircle, Loader2, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { PROFESSIONS } from '@/types/kanban';

type Step = 'login' | 'profile' | 'telegram' | 'success';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('login');
  const [profession, setProfession] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [skipTelegram, setSkipTelegram] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetupMode = searchParams.get('setup') === 'true';
  const { signInWithGoogle, updateUserProfile, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    console.log('=== LOGIN DEBUG ===');
    console.log('userProfile:', userProfile);
    console.log('authLoading:', authLoading);
    console.log('step:', step);
    console.log('isSetupMode:', isSetupMode);
    console.log('profession from profile:', userProfile?.profession);
    console.log('==================');
  }, [userProfile, authLoading, step, isSetupMode]);

  useEffect(() => {
    if (isSetupMode && userProfile && step === 'login') {
      console.log('Setup mode detected, showing profile form');
      setStep('profile');
      if (userProfile.profession && userProfile.profession !== 'unknown') {
        setProfession(userProfile.profession);
      }
    }
  }, [isSetupMode, userProfile, step]);

  useEffect(() => {
    if (!authLoading && userProfile && step === 'login' && !isSetupMode) {
      console.log('Checking existing user...');
      if (userProfile.profession && userProfile.profession !== 'unknown') {
        console.log('User has profession, redirecting to dashboard');
        navigate('/dashboard');
      }
    }
  }, [userProfile, authLoading, navigate, step, isSetupMode]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('=== SIGN IN START ===');
      const { user, isNewUser } = await signInWithGoogle();
      console.log('Sign in result:', { isNewUser, userEmail: user.email });
      
      console.log('Forcing profile step');
      setStep('profile');
      
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError('Ошибка при авторизации через Google. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!profession) {
      setError('Выберите профессию');
      return;
    }

    setLoading(true);
    try {
      console.log('=== UPDATING PROFILE ===');
      console.log('Selected profession:', profession);
      
      await updateUserProfile({ 
        profession,
        updatedAt: new Date()
      });
      
      console.log('Profile updated, going to telegram step');
      setStep('telegram');
      setError(null);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError('Ошибка при сохранении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLink = async () => {
    if (!skipTelegram && !telegramUsername.trim()) {
      setError('Введите Telegram username или пропустите этот шаг');
      return;
    }

    setLoading(true);
    try {
      if (!skipTelegram && telegramUsername.trim()) {
        const username = telegramUsername.startsWith('@') 
          ? telegramUsername 
          : `@${telegramUsername}`;
        
        console.log('Linking Telegram:', username);
        await updateUserProfile({ 
          telegramUsername: username,
          telegramId: `temp_${Date.now()}`
        });
      }

      setStep('success');
      setTimeout(() => {
        console.log('Redirecting to dashboard...');
        navigate('/dashboard');
      }, 2000);
      setError(null);
    } catch (err: any) {
      console.error('Telegram link error:', err);
      setError('Ошибка при привязке Telegram аккаунта');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToSuccess = () => {
    console.log('Skipping to success');
    setStep('success');
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  const handleResetProfile = () => {
    console.log('Resetting profile...');
    localStorage.clear();
    updateUserProfile({ profession: 'unknown' });
    setStep('profile');
    setProfession('');
  };

  const renderStep = () => {
    switch (step) {
      case 'login':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold text-2xl">K</span>
              </div>
              <CardTitle>Добро пожаловать</CardTitle>
              <CardDescription>
                Войдите в систему для управления задачами
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <div>User: {userProfile?.email || 'None'}</div>
                <div>Profession: {userProfile?.profession || 'None'}</div>
                <div>Auth Loading: {authLoading ? 'Yes' : 'No'}</div>
                <div>Setup Mode: {isSetupMode ? 'Yes' : 'No'}</div>
              </div>

              <Button 
                onClick={handleGoogleSignIn} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Chrome className="w-5 h-5 mr-2" />
                    Войти через Google
                  </>
                )}
              </Button>

              {userProfile && (
                <div className="space-y-2">
                  <Button 
                    variant="outline"
                    onClick={() => setStep('profile')}
                    className="w-full"
                    size="sm"
                  >
                    Показать форму профиля
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleResetProfile}
                    className="w-full"
                    size="sm"
                  >
                    Сбросить профиль
                  </Button>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <p>Быстро и безопасно</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'profile':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold text-2xl">K</span>
              </div>
              <CardTitle>Завершение настройки</CardTitle>
              <CardDescription>
                Выберите вашу профессию для персонализации
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <div>Current user: {userProfile?.name || 'Unknown'}</div>
                <div>Email: {userProfile?.email || 'Unknown'}</div>
                <div>Current profession: {userProfile?.profession || 'None'}</div>
                <div>Selected: {profession || 'None'}</div>
                <div>Setup Mode: {isSetupMode ? 'Yes' : 'No'}</div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Выберите профессию:</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PROFESSIONS).map(([key, prof]) => (
                    <Button
                      key={key}
                      variant={profession === key ? "default" : "outline"}
                      className="h-auto p-3 flex flex-col items-center gap-1"
                      onClick={() => {
                        setProfession(key);
                        console.log('Selected profession:', key);
                      }}
                    >
                      <span className="text-lg">{prof.icon}</span>
                      <span className="text-xs">{prof.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1" 
                onClick={handleSkipToSuccess}
              >
                Пропустить
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleCompleteProfile}
                disabled={!profession || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Продолжить'
                )}
              </Button>
            </CardFooter>
          </Card>
        );

      case 'telegram':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-[#0088cc] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle>Подключение Telegram</CardTitle>
              <CardDescription>
                Привяжите аккаунт для получения уведомлений (необязательно)
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!skipTelegram ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telegram username</label>
                    <Input
                      placeholder="@username или username"
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value)}
                    />
                  </div>

                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Преимущества подключения:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Уведомления о новых задачах</li>
                      <li>• Напоминания о дедлайнах</li>
                      <li>• Управление задачами через бот</li>
                    </ul>
                  </div>

                  <Button 
                    variant="link" 
                    className="w-full"
                    onClick={() => setSkipTelegram(true)}
                  >
                    Пропустить этот шаг
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Вы можете подключить Telegram позже в настройках профиля
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSkipTelegram(false)}
                  >
                    Вернуться назад
                  </Button>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1" 
                onClick={handleSkipToSuccess}
              >
                Пропустить
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleTelegramLink}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {skipTelegram ? 'Продолжить без Telegram' : 'Связать аккаунт'}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        );

      case 'success':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-success rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle>Добро пожаловать!</CardTitle>
              <CardDescription>
                Ваш аккаунт настроен. Перенаправление на доску задач...
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-primary-foreground font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <p className="text-muted-foreground">Управление задачами эффективно</p>
        </div>

        {renderStep()}

        {step !== 'login' && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {['login', 'profile', 'telegram', 'success'].map((stepName, index) => {
                const isActive = step === stepName;
                const isCompleted = ['login', 'profile', 'telegram', 'success'].indexOf(step) > index;
                
                return (
                  <div
                    key={stepName}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isActive || isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>
            Используя приложение, вы соглашаетесь с условиями использования
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;