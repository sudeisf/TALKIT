import { Button } from '../ui/button';
import Image from 'next/image';
import avatar from '../../../public/svg/cool-guy.svg';
import AskQuestion from './AskQuestionDialog';
import Link from 'next/link';

interface props {
  btnName: string;
  name: string;
}

export default function GreetingCard({ btnName, name }: props) {
  return (
    <div className="max-w-7xl mt-4 w-full mx-auto bg-primary flex justify-around  h-[220px] rounded-md shadow-xs">
      <div className="justify-center flex flex-col gap-3">
        <h1 className="text-primary-foreground font-sans font-medium text-5xl capitalize p-y">
          wellcome to Talkit , {name} !
        </h1>
        <p className="text-primary-foreground font-sans font-medium text-md capitalize">
          Best palce to get feedback from users
        </p>

        {btnName === 'Start Helping' ? (
          <Link href="/questions" className="w-1/3">
            <Button className="bg-white text-black rounded-sm w-full hover:bg-accent">
              {btnName}
            </Button>
          </Link>
        ) : (
          <AskQuestion
            btnChild={
              <Button className="bg-white text-black rounded-sm w-1/3 hover:bg-accent">
                {btnName}
              </Button>
            }
          />
        )}
      </div>
      <div className="relative w-[400px] h-[250px] -ml-10 -mt-5">
        <Image src={avatar} fill alt="" className="object-center rounded-md" />
      </div>
    </div>
  );
}
