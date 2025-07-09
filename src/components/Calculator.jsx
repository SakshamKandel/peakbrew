import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Title,
  ActionIcon,
  SimpleGrid,
  Box,
  Flex,
  Badge,
  Tabs,
  NumberInput,
  Grid,
  Divider,
  Paper,
  Center,
  Tooltip,
  Switch,
  Select
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCalculator,
  IconCopy,
  IconTrash,
  IconHistory,
  IconPercentage,
  IconMinus,
  IconPlus,
  IconX,
  IconDivide,
  IconEqual,
  IconBackspace,
  IconPoint,
  IconSquareRoot,
  IconMathFunction,
  IconCurrencyDollar,
  IconPercentage as IconTax,
  IconDiscount2 as IconDiscount,
  IconReceipt
} from '@tabler/icons-react';
import Logo from './Logo';
import { COMPANY_INFO } from '../constants/companyInfo';

const Calculator = () => {
  const navigate = useNavigate();
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [memory, setMemory] = useState(0);
  const [isScientific, setIsScientific] = useState(false);
  
  // Business Calculator states
  const [taxRate, setTaxRate] = useState(8.25);
  const [discountRate, setDiscountRate] = useState(10);
  const [tipRate, setTipRate] = useState(15);
  const [markupRate, setMarkupRate] = useState(50);

  const addToHistory = (calculation) => {
    const historyItem = {
      id: Date.now(),
      calculation,
      timestamp: new Date().toLocaleTimeString(),
      result: display
    };
    setHistory(prev => [historyItem, ...prev].slice(0, 10));
  };

  const calculate = () => {
    if (previousValue === null || operation === null) return;
    
    const current = parseFloat(display);
    const previous = parseFloat(previousValue);
    let result;
    
    switch (operation) {
      case '+':
        result = previous + current;
        break;
      case '-':
        result = previous - current;
        break;
      case '*':
        result = previous * current;
        break;
      case '/':
        result = current !== 0 ? previous / current : 0;
        break;
      case '%':
        result = previous % current;
        break;
      case '^':
        result = Math.pow(previous, current);
        break;
      default:
        return;
    }
    
    const calculation = `${previous} ${operation} ${current}`;
    addToHistory(calculation);
    
    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(true);
  };

  const handleNumber = (num) => {
    if (waitingForNewValue) {
      setDisplay(String(num));
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const handleOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      calculate();
      setPreviousValue(parseFloat(display));
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const handleScientific = (func) => {
    const current = parseFloat(display);
    let result;
    
    switch (func) {
      case 'sqrt':
        result = Math.sqrt(current);
        break;
      case 'sin':
        result = Math.sin(current * Math.PI / 180);
        break;
      case 'cos':
        result = Math.cos(current * Math.PI / 180);
        break;
      case 'tan':
        result = Math.tan(current * Math.PI / 180);
        break;
      case 'log':
        result = Math.log10(current);
        break;
      case 'ln':
        result = Math.log(current);
        break;
      default:
        return;
    }
    
    addToHistory(`${func}(${current})`);
    setDisplay(String(result));
    setWaitingForNewValue(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(display);
    console.log(`${display} copied to clipboard`);
  };

  const calculateTax = () => {
    const amount = parseFloat(display);
    const tax = amount * (taxRate / 100);
    const total = amount + tax;
    addToHistory(`Tax: ${amount} + ${tax.toFixed(2)} (${taxRate}%)`);
    setDisplay(String(total.toFixed(2)));
    setWaitingForNewValue(true);
  };

  const calculateDiscount = () => {
    const amount = parseFloat(display);
    const discount = amount * (discountRate / 100);
    const total = amount - discount;
    addToHistory(`Discount: ${amount} - ${discount.toFixed(2)} (${discountRate}%)`);
    setDisplay(String(total.toFixed(2)));
    setWaitingForNewValue(true);
  };

  const calculateTip = () => {
    const amount = parseFloat(display);
    const tip = amount * (tipRate / 100);
    const total = amount + tip;
    addToHistory(`Tip: ${amount} + ${tip.toFixed(2)} (${tipRate}%)`);
    setDisplay(String(total.toFixed(2)));
    setWaitingForNewValue(true);
  };

  const calculateMarkup = () => {
    const cost = parseFloat(display);
    const markup = cost * (markupRate / 100);
    const price = cost + markup;
    addToHistory(`Markup: ${cost} + ${markup.toFixed(2)} (${markupRate}%)`);
    setDisplay(String(price.toFixed(2)));
    setWaitingForNewValue(true);
  };

  const ButtonStyle = {
    height: '60px',
    fontSize: '18px',
    fontWeight: 600,
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a3728 0%, #2d1f1a 50%, #1a1310 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <Container size="lg" px={0}>
        {/* Header */}
        <Card
          shadow="xl"
          padding="xl"
          radius="xl"
          mb="xl"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(74, 55, 40, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            color: '#ffffff'
          }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="md">
              <ActionIcon
                size="lg"
                variant="light"
                onClick={() => navigate('/dashboard')}
                style={{
                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                  color: '#9ca3af',
                  border: '1px solid rgba(156, 163, 175, 0.2)'
                }}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              
              <Group gap="md">
                <Logo size={60} />
                <div>
                  <Title order={1} style={{ color: '#d4af37', marginBottom: '8px' }}>
                    Professional Calculator
                  </Title>
                  <Text size="lg" style={{ color: '#a1a1aa' }}>
                    Advanced calculations for business and scientific needs
                  </Text>
                </div>
              </Group>
            </Group>
            
            <Group gap="md">
              <Switch
                checked={isScientific}
                onChange={(event) => setIsScientific(event.currentTarget.checked)}
                label="Scientific Mode"
                color="yellow"
                thumbIcon={
                  isScientific ? (
                    <IconMathFunction size={12} stroke={2.5} />
                  ) : (
                    <IconCalculator size={12} stroke={2.5} />
                  )
                }
                styles={{
                  label: { color: '#ffffff' }
                }}
              />
            </Group>
          </Flex>
        </Card>

        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            {/* Main Calculator */}
            <Card
              shadow="xl"
              padding="xl"
              radius="xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              {/* Display */}
              <Paper
                p="xl"
                mb="xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '16px',
                  minHeight: '120px'
                }}
              >
                <Flex justify="space-between" align="flex-start" mb="md">
                  <Badge variant="light" color="yellow" size="sm">
                    {operation ? `${previousValue} ${operation}` : 'Ready'}
                  </Badge>
                  <Group gap="xs">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="yellow"
                      onClick={copyToClipboard}
                      title="Copy to clipboard"
                    >
                      <IconCopy size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={handleBackspace}
                      title="Backspace"
                    >
                      <IconBackspace size={14} />
                    </ActionIcon>
                  </Group>
                </Flex>
                
                <Text
                  size="3xl"
                  fw={700}
                  style={{
                    color: '#d4af37',
                    fontFamily: 'monospace',
                    textAlign: 'right',
                    wordBreak: 'break-all',
                    fontSize: display.length > 10 ? '2rem' : '3rem'
                  }}
                >
                  {display}
                </Text>
              </Paper>

              {/* Calculator Buttons */}
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                  <Tabs.Tab value="basic" leftSection={<IconCalculator size={16} />}>
                    Basic
                  </Tabs.Tab>
                  <Tabs.Tab value="business" leftSection={<IconCurrencyDollar size={16} />}>
                    Business
                  </Tabs.Tab>
                  {isScientific && (
                    <Tabs.Tab value="scientific" leftSection={<IconMathFunction size={16} />}>
                      Scientific
                    </Tabs.Tab>
                  )}
                </Tabs.List>

                <Tabs.Panel value="basic">
                  <SimpleGrid cols={4} spacing="md">
                    <Button
                      variant="filled"
                      color="red"
                      onClick={handleClear}
                      style={ButtonStyle}
                    >
                      C
                    </Button>
                    <Button
                      variant="light"
                      color="yellow"
                      onClick={() => handleOperation('%')}
                      style={ButtonStyle}
                    >
                      <IconPercentage size={18} />
                    </Button>
                    <Button
                      variant="light"
                      color="yellow"
                      onClick={() => handleOperation('/')}
                      style={ButtonStyle}
                    >
                      <IconDivide size={18} />
                    </Button>
                    <Button
                      variant="light"
                      color="yellow"
                      onClick={() => handleOperation('*')}
                      style={ButtonStyle}
                    >
                      <IconX size={18} />
                    </Button>

                    <Button onClick={() => handleNumber(7)} style={ButtonStyle}>7</Button>
                    <Button onClick={() => handleNumber(8)} style={ButtonStyle}>8</Button>
                    <Button onClick={() => handleNumber(9)} style={ButtonStyle}>9</Button>
                    <Button
                      variant="light"
                      color="yellow"
                      onClick={() => handleOperation('-')}
                      style={ButtonStyle}
                    >
                      <IconMinus size={18} />
                    </Button>

                    <Button onClick={() => handleNumber(4)} style={ButtonStyle}>4</Button>
                    <Button onClick={() => handleNumber(5)} style={ButtonStyle}>5</Button>
                    <Button onClick={() => handleNumber(6)} style={ButtonStyle}>6</Button>
                    <Button
                      variant="light"
                      color="yellow"
                      onClick={() => handleOperation('+')}
                      style={ButtonStyle}
                    >
                      <IconPlus size={18} />
                    </Button>

                    <Button onClick={() => handleNumber(1)} style={ButtonStyle}>1</Button>
                    <Button onClick={() => handleNumber(2)} style={ButtonStyle}>2</Button>
                    <Button onClick={() => handleNumber(3)} style={ButtonStyle}>3</Button>
                    <Button
                      variant="filled"
                      color="green"
                      onClick={calculate}
                      style={{ ...ButtonStyle, gridRowEnd: 'span 2' }}
                    >
                      <IconEqual size={18} />
                    </Button>

                    <Button
                      onClick={() => handleNumber(0)}
                      style={{ ...ButtonStyle, gridColumnEnd: 'span 2' }}
                    >
                      0
                    </Button>
                    <Button
                      variant="light"
                      onClick={handleDecimal}
                      style={ButtonStyle}
                    >
                      <IconPoint size={18} />
                    </Button>
                  </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="business">
                  <Stack gap="md">
                    <SimpleGrid cols={2} spacing="md">
                      <Group>
                        <Text size="sm" style={{ color: '#d4af37' }}>Tax Rate:</Text>
                        <NumberInput
                          value={taxRate}
                          onChange={(value) => setTaxRate(value)}
                          suffix="%"
                          size="sm"
                          styles={{
                            input: {
                              backgroundColor: 'rgba(74, 55, 40, 0.3)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              color: '#ffffff'
                            }
                          }}
                        />
                      </Group>
                      <Group>
                        <Text size="sm" style={{ color: '#d4af37' }}>Discount:</Text>
                        <NumberInput
                          value={discountRate}
                          onChange={(value) => setDiscountRate(value)}
                          suffix="%"
                          size="sm"
                          styles={{
                            input: {
                              backgroundColor: 'rgba(74, 55, 40, 0.3)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              color: '#ffffff'
                            }
                          }}
                        />
                      </Group>
                    </SimpleGrid>

                    <SimpleGrid cols={2} spacing="md">
                      <Button
                        leftSection={<IconTax size={16} />}
                        onClick={calculateTax}
                        variant="light"
                        color="blue"
                        style={ButtonStyle}
                      >
                        Add Tax
                      </Button>
                      <Button
                        leftSection={<IconDiscount size={16} />}
                        onClick={calculateDiscount}
                        variant="light"
                        color="orange"
                        style={ButtonStyle}
                      >
                        Apply Discount
                      </Button>
                    </SimpleGrid>

                    <SimpleGrid cols={2} spacing="md">
                      <Group>
                        <Text size="sm" style={{ color: '#d4af37' }}>Tip Rate:</Text>
                        <NumberInput
                          value={tipRate}
                          onChange={(value) => setTipRate(value)}
                          suffix="%"
                          size="sm"
                          styles={{
                            input: {
                              backgroundColor: 'rgba(74, 55, 40, 0.3)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              color: '#ffffff'
                            }
                          }}
                        />
                      </Group>
                      <Group>
                        <Text size="sm" style={{ color: '#d4af37' }}>Markup:</Text>
                        <NumberInput
                          value={markupRate}
                          onChange={(value) => setMarkupRate(value)}
                          suffix="%"
                          size="sm"
                          styles={{
                            input: {
                              backgroundColor: 'rgba(74, 55, 40, 0.3)',
                              border: '1px solid rgba(212, 175, 55, 0.3)',
                              color: '#ffffff'
                            }
                          }}
                        />
                      </Group>
                    </SimpleGrid>

                    <SimpleGrid cols={2} spacing="md">
                      <Button
                        leftSection={<IconReceipt size={16} />}
                        onClick={calculateTip}
                        variant="light"
                        color="green"
                        style={ButtonStyle}
                      >
                        Add Tip
                      </Button>
                      <Button
                        leftSection={<IconCurrencyDollar size={16} />}
                        onClick={calculateMarkup}
                        variant="light"
                        color="teal"
                        style={ButtonStyle}
                      >
                        Add Markup
                      </Button>
                    </SimpleGrid>
                  </Stack>
                </Tabs.Panel>

                {isScientific && (
                  <Tabs.Panel value="scientific">
                    <SimpleGrid cols={3} spacing="md">
                      <Button
                        onClick={() => handleScientific('sqrt')}
                        variant="light"
                        color="violet"
                        style={ButtonStyle}
                      >
                        <IconSquareRoot size={18} />
                      </Button>
                      <Button
                        onClick={() => handleScientific('sin')}
                        variant="light"
                        color="violet"
                        style={ButtonStyle}
                      >
                        sin
                      </Button>
                      <Button
                        onClick={() => handleScientific('cos')}
                        variant="light"
                        color="violet"
                        style={ButtonStyle}
                      >
                        cos
                      </Button>
                      <Button
                        onClick={() => handleScientific('tan')}
                        variant="light"
                        color="violet"
                        style={ButtonStyle}
                      >
                        tan
                      </Button>
                      <Button
                        onClick={() => handleScientific('log')}
                        variant="light"
                        color="violet"
                        style={ButtonStyle}
                      >
                        log
                      </Button>
                      <Button
                        onClick={() => handleScientific('ln')}
                        variant="light"
                        color="violet"
                        style={ButtonStyle}
                      >
                        ln
                      </Button>
                      <Button
                        onClick={() => handleOperation('^')}
                        variant="light"
                        color="violet"
                        style={ButtonStyle}
                      >
                        x^y
                      </Button>
                      <Button
                        onClick={() => handleNumber(Math.PI)}
                        variant="light"
                        color="violet"
                        style={ButtonStyle}
                      >
                        π
                      </Button>
                      <Button
                        onClick={() => handleNumber(Math.E)}
                        variant="light"
                        color="violet"
                        style={ButtonStyle}
                      >
                        e
                      </Button>
                    </SimpleGrid>
                  </Tabs.Panel>
                )}
              </Tabs>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            {/* History Panel */}
            <Card
              shadow="xl"
              padding="xl"
              radius="xl"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(74, 55, 40, 0.03) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                color: '#ffffff',
                height: 'fit-content'
              }}
            >
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <IconHistory size={20} style={{ color: '#d4af37' }} />
                  <Title order={4} style={{ color: '#d4af37' }}>
                    History
                  </Title>
                </Group>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => setHistory([])}
                  title="Clear history"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>

              {history.length === 0 ? (
                <Center py="xl">
                  <Text size="sm" style={{ color: '#a1a1aa' }}>
                    No calculations yet
                  </Text>
                </Center>
              ) : (
                <Stack gap="sm" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {history.map((item) => (
                    <Paper
                      key={item.id}
                      p="md"
                      style={{
                        background: 'rgba(74, 55, 40, 0.2)',
                        border: '1px solid rgba(212, 175, 55, 0.1)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setDisplay(item.result);
                        setWaitingForNewValue(true);
                      }}
                    >
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text size="sm" style={{ color: '#a1a1aa' }}>
                            {item.calculation}
                          </Text>
                          <Text size="lg" fw={600} style={{ color: '#d4af37' }}>
                            = {item.result}
                          </Text>
                        </div>
                        <Text size="xs" style={{ color: '#a1a1aa' }}>
                          {item.timestamp}
                        </Text>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
};

export default Calculator;