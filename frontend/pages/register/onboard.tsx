import AccountType from "./accountype";
import Image from 'next/image'

interface AccountPros {
    selected : string | null
     setSelected: (value: string | null) => void;
    onCreateAccount: () => void; 
}

export default function OnboardScreen({selected, setSelected,onCreateAccount}: AccountPros){

    return(
        <>
   
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
     <AccountType
       selected={selected}
       setSelected={setSelected}
       onCreateAccount={onCreateAccount}
     />

  
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
       </>
    )
}