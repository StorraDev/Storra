import Image from 'next/image'
import { useState } from 'react';

type AccountType = 'student' | 'parent' | 'teacher';

interface Account {
  key: AccountType;
  icon: string;
  title: string;
  description: string;
}
export default function AccountType() {
const [selected, setSelected] = useState<AccountType | null>(null);
  const accounts: Account[] = [
    {
      key: 'student',
     icon: '/onboard/st.svg',
      title: 'Student Account',
      description: 'You’re just one step away from learning & earning',
    },
    {
      key: 'parent',
       icon: '/onboard/par.svg',
      title: 'Parent Account',
      description: 'Track your child’s learning. Set limits. Earn together',
    },
    {
      key: 'teacher',
      icon: '/onboard/tec.svg',
      title: 'Teacher Account',
      description:'Get tools to manage students, assign quizzes, and monitor performance',
    },
  ];
  const handleAccountSelect = (key: AccountType) => {
  setSelected(key);
};


  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans">
       {/* show on tablet */}

<div className="w-full md:min-h-[450px] md:relative hidden md:block lg:hidden">
  <div className="absolute inset-4 rounded-[40px] bg-[#2D5BFF] overflow-hidden">
    <div className="grid grid-cols-2 h-full">
      <div className="flex flex-col justify-center items-center p-8">
        <div className="text-white max-w-[300px]">
      <h2 className="font-bold text-[32px] leading-[1.5] tracking-[0] mb-4">
  Fun, gamified learning for every age group.
</h2>
      <p className="font-normal text-[20px] leading-[1.5] tracking-[0] text-[#DDE8FF] mb-8">
  Explore fun lessons with videos, stories, games, and daily quizzes.
</p>
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-2 rounded-full bg-white/30"></div>
            <div className="w-6 h-2 rounded-full bg-white"></div>
            <div className="w-6 h-2 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>

      {/* Right Column - Image with Dotted BG */}
     <div className="relative w-full h-[400px] overflow-hidden">
  <div className="absolute top-[20px] left-[30px] right-[30px] bg-[radial-gradient(white_1px,transparent_1px)] bg-[size:20px_20px]">
    <div className="h-full flex items-center justify-center p-4">
      <Image
        src="/onboard/on.svg"
        alt="Learning Illustration"
        width={400}
        height={400}
        className="w-full h-[400px] w-[400px] "
        priority
      />
    </div>
  </div>
</div>
    </div>
  </div>
</div>
      {/* show on all screen */}
      <div className="w-full lg:w-1/2 lg:min-h-[calc(100vh-32px)] flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-md w-full">
 
          <div className="flex justify-center mb-6">
      <Image
  src="/logo.svg"
  alt="Storra Logo"
  width={104}
  height={104}
  className="w-[80px] h-[80px] md:w-[104px] md:h-[104px] object-contain"
/>
          </div>

  
          <h1 className="text-[20px] md:text-[28px] font-bold text-center text-[#222632] mb-8 leading-snug">
            Which Account Type Would <br /> You Like to Create
          </h1>

    
 <div className="space-y-4 mb-8">
  {accounts.map((account) => (
    <div
      key={account.key}
      onClick={() => handleAccountSelect(account.key)}
      className={`p-5 rounded-xl cursor-pointer flex items-center justify-between transition border ${
        selected === account.key
          ? 'border-2 border-[#246BFD] bg-[#F0F5FF]'
          : 'border border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <Image 
            src={account.icon} 
            alt={account.title} 
            width={16}
            height={16}
            className="w-4 h-4"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-[#1A1A1A]">{account.title}</h3>
          <p className="text-sm text-[#1A1A1ACC] mt-1 ">
            {account.description}
          </p>
        </div>
      </div>

     
      <div className={`flex-shrink-0 ml-4 w-6 h-6 rounded-full  ${selected === account.key ? 'border-[#246BFD]  border-2':'border-[#DFDFDF] border-2 '} flex items-center justify-center`}>
        {selected === account.key && (
          <div className="w-3.5 h-3.5 bg-[#2D5BFF] rounded-full" />
        )}
      </div>
    </div>
  ))}
</div>

      
      <button
  className={`w-full transition h-12 md:h-16 text-white font-medium py-5 px-10 rounded-[32px] text-md flex items-center justify-center gap-2 ${
    selected 
      ? 'bg-[#2D5BFF] hover:bg-[#1A4BD1]'  
      : 'bg-[#BABBC0] hover:bg-gray-500'    
  }`}
disabled={!selected}  
>
  Create Teacher Account
</button>
         
        
        </div>
      </div>
  {/* show only on laptop */}
  <div className="w-full lg:w-1/2 lg:min-h-[calc(100vh-32px)] lg:relative hidden lg:block">
    <div className="absolute top-4 right-4 bottom-4 left-4 rounded-[40px] bg-[#2D5BFF] overflow-hidden">
      <div className="absolute h-[500px] top-[40px] left-[70px] right-[70px] min-h-[200px] bg-[radial-gradient(white_1px,transparent_1px)] bg-[size:20px_20px] flex flex-col items-center justify-between pt-8 pb-4">
        <Image
          src="/onboard/on.svg"
          alt="Learning Illustration"
          width={600}
          height={600}
          className="mx-auto mb-6 w-[600px] h-[600px]"
          priority
        />
        <div className="text-center text-white max-w-md px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Fun, gamified learning for every age group.
          </h2>
          <p className="text-sm text-[#E0E1E5] mb-8">
            Explore fun lessons with videos, stories, games, and daily quizzes.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-2 rounded-full bg-white/30"></div>
          <div className="w-8 h-2 rounded-full bg-white"></div>
          <div className="w-8 h-2 rounded-full bg-white/30"></div>
        </div>
      </div>
    </div>
  </div>


    </div>
  )
}
