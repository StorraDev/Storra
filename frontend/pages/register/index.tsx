import { useState } from 'react';
import AuthLayout from '@/components/AuthLayout'
import Button from '@/components/ui/button'
import { IoIosArrowRoundBack } from 'react-icons/io'
import StudentForm from './stundetform';
import ParentForm from './parentform';
import TeacherForm from './teacherform';
import OnboardScreen from './onboard';
import Head from 'next/head';
type AccountType = 'student' | 'parent' | 'teacher';
export default function Register() {
const [selected, setSelected] = useState<AccountType | null>(null);
const [userType, setUserType] = useState<AccountType | null>(null);

 const handleCreateAccount = () => {
  console.log('Selected Account Typse:', selected);
    if (selected) {
    setUserType(selected)
    }
  };
console.log('User  Type:', userType);
console.log('  Type:', selected);
  return (
    <>
   <Head>
        <title>Register - Storra Learning Platform</title>
        <meta
          name='description'
          content='Create your account on Storra - Join our gamified learning platform and start your educational journey today.'
        />
        <meta
          property='og:title'
          content='Register - Storra Learning Platform'
        />
        <meta
          property='og:description'
          content='Create your account on Storra - Join our gamified learning platform and start your educational journey today.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://storra.com/register' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Register - Storra Learning Platform'
        />
        <meta
          name='twitter:description'
          content='Create your account on Storra - Join our gamified learning platform and start your educational journey today.'
        />
        <link rel='canonical' href='https://storra.com/register' />
      </Head>
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans">
      
         {!userType && (
              <>
        <OnboardScreen 
        selected={selected}
       setSelected={setSelected}
       onCreateAccount={handleCreateAccount }
        />

    </>
    )}

{userType && (
      <AuthLayout userType={userType}  >
        {' '}
        <main className='flex flex-col gap-5 h-full w-full items-center justify-center'>
          <Button
            type='button'
            variant='ghost'
            className='p-2 h-12 w-12 mr-auto rounded-full text-3xl'
            onClick={() => setUserType(null)}
          >
            <IoIosArrowRoundBack />
          </Button>
          {userType === 'student' && (
          <StudentForm />
          )}

          {userType === 'parent' && (
           <ParentForm />
          )}

          {userType === 'teacher' && (
          <TeacherForm />
          )}
        </main>
      </AuthLayout>
 )}
   
    </div>

    </>
  )
}
