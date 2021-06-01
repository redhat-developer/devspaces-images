# React Pluralize
A tiny pluralization component. Also check out [react-since](https://www.npmjs.com/package/react-since), another tiny component that presents time passed in a humanistic format.

## Install
    npm install react-pluralize --save

## Import
    import Pluralize from 'react-pluralize'

## Use
    <Pluralize singular={'view'} count={3} /> => 3 views
    <Pluralize singular={'person'} plural={'people'} count={3} /> => 3 people
    <Pluralize singular={'like'} showCount={false}/> => like
    <Pluralize singular={'click'} count={0} /> => 0 clicks
    <Pluralize singular={'hit'} count={0} zero={'Nothing to show'}/> => Nothing to show

## Props

**singular** (required)(String)
The singular form of the noun

**plural** (optional)(default: singular + 's')(String)
The plural form of the noun if required (i.e. when the plural form isn't just 's' added to the end)

**count** (optional)(default: 1)(Number)
The count value used to determine whether the singular or plural form should be used.

**showCount** (optional)(default: true)(Boolean)
If you would prefer not to see the count in the output then set this prop to false.

**zero** (optional)(default: null)(String)
If you would like to show a different message when the count is 0 you can provide this prop.

**className** (optional)(default: null)(String)

**style** (optional)(default: {})(Object)
